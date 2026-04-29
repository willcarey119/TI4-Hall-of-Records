import json
import glob
import os
import pandas as pd
import numpy as np
from collections import defaultdict, Counter
from datetime import datetime

# ==========================================
# SECTION 1: CONSTANTS & REFERENCE DATA
# ==========================================

SC_INFO = {
    "Leadership": {"init": 1},
    "Diplomacy": {"init": 2},
    "Politics": {"init": 3},
    "Construction": {"init": 4},
    "Trade": {"init": 5},
    "Warfare": {"init": 6},
    "Technology": {"init": 7},
    "Imperial": {"init": 8}
}

POK_STAGE_2 = {
    "Centralize Galactic Trade", "Conquer the Weak", "Form a Spy Network", "Found a Golden Age",
    "Galvanize the People", "Manipulate Galactic Law", "Master the Sciences", "Subdue the Galaxy",
    "Unify the Colonies", "Win the Structures", "Achieve Supremacy", "Become a Legend",
    "Command an Armada", "Control the Borderland", "Defy Space and Time", "Destroy Their Greatest Ship",
    "Hold Vast Reserves", "Patrol Vast Territories", "Protect the Border", "Reclaim Ancient Monuments",
    "Revolutionize Warfare", "Rule Distant Lands"
}

# Tech Database for Categorization
TECH_DB = {
    # Blue
    "Antimass Deflectors": "Blue", "Gravity Drive": "Blue", "Fleet Logistics": "Blue", "Light/Wave Deflector": "Blue",
    "Dark Energy Tap": "Blue", "Sling Relay": "Blue",
    # Green
    "Neural Motivator": "Green", "Dacxive Animators": "Green", "Hyper Metabolism": "Green",
    "X-89 Bacterial Weapon": "Green",
    "Bio-Stims": "Green", "Psychoarchaeology": "Green",
    # Red
    "Plasma Scoring": "Red", "Magen Defense Grid": "Red", "Duranium Armor": "Red", "Assault Cannon": "Red",
    "Self-Assembly Routines": "Red", "AI Development Algorithm": "Red",
    # Yellow
    "Sarween Tools": "Yellow", "Scanlink Drone Network": "Yellow", "Transit Diodes": "Yellow",
    "Integrated Economy": "Yellow",
    "Predictive Intelligence": "Yellow", "Graviton Laser System": "Yellow",
    # Unit Upgrades (Generic - Faction specific handled in logic)
    "Carrier II": "Unit", "Cruiser II": "Unit", "Destroyer II": "Unit", "Dreadnought II": "Unit",
    "Fighter II": "Unit", "Infantry II": "Unit", "PDS II": "Unit", "Space Dock II": "Unit", "War Sun": "Unit"
}


def get_objective_points(obj_name):
    if obj_name in POK_STAGE_2: return 2
    return 1  # Stage 1, Secret, Support, Custodians, etc.


# ==========================================
# SECTION 2: CLASSES
# ==========================================

class PlayerGameStats:
    def __init__(self, name, faction, color):
        self.name = name
        self.faction = faction
        self.color = color
        self.is_winner = False
        self.total_score = 0
        self.custodians_point = False

        # Tech Tracking
        self.starting_techs = []
        self.researched_techs = []
        self.all_techs = []

        # SC Tracking
        self.sc_picks = []  # List of tuples (CardName, Round)


class TI4Game:
    def __init__(self, filepath):
        self.filepath = filepath
        self.filename = os.path.basename(filepath)
        self.valid = False
        self.metadata = {}
        self.players = {}  # Key: FactionID
        self.logs = []

        # State machines
        self.current_round = 1
        self.highest_strategy_phase_round = 0  # STRICT tracking of Phase=STRATEGY
        self.sc_owners = {}  # Card -> FactionID (for winner determination)
        self.custodians_taken = False

        self.load_and_parse()

    def load_and_parse(self):
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                raw = json.load(f)

            data = raw.get('data', {})
            # Sort logs by timestamp to ensure chronological order
            self.logs = sorted(
                raw.get('actionLog', []),
                key=lambda x: x.get('timestampMillis') or x.get('data', {}).get('timestamp', 0)
            )

            # 1. Parse Metadata
            opts = data.get('options', {})
            ts_start = self.logs[0].get('timestampMillis', 0) if self.logs else 0
            date_str = datetime.fromtimestamp(ts_start / 1000).strftime('%Y-%m-%d') if ts_start else "Unknown"

            self.metadata = {
                'id': self.filename,
                'date': date_str,
                'vp_goal': int(opts.get('victory-points', 10)),
                'rounds': 0
            }

            # 2. Initialize Players
            factions = data.get('factions', [])
            for f in factions:
                fid = f.get('id')
                p = PlayerGameStats(f.get('playerName', 'Unknown'), fid, f.get('color'))

                # Starting Techs
                start_data = f.get('startswith', {})
                if isinstance(start_data, dict):
                    p.starting_techs = start_data.get('techs', [])
                elif isinstance(start_data, list):
                    pass

                self.players[fid] = p

            # 3. Process Action Log
            self.process_log()

            # 4. Determine Winner
            self.determine_winner()

            self.valid = True

        except Exception as e:
            print(f"FAILED to parse {self.filename}: {e}")
            self.valid = False

    def process_log(self):
        self.current_round = 1
        self.highest_strategy_phase_round = 0
        seen_sc_states = set()

        for entry in self.logs:
            d = entry.get('data', {})
            action = d.get('action')
            event = d.get('event', {})

            # --- ROUND & PHASE TRACKING ---
            state = entry.get('state', {}) or d.get('state', {})
            entry_round = state.get('round')
            entry_phase = str(state.get('phase', '')).upper()

            # Update global max round latch (fallback tracking)
            if entry_round and entry_round > self.current_round:
                self.current_round = entry_round

            # Determine effective round for this specific entry
            effective_round = entry_round if entry_round else self.current_round

            # --- STRICT GAME ROUNDS CALCULATION ---
            # As requested: Rely on "phase":"STRATEGY","round":N to drive round count.
            if entry_phase == 'STRATEGY' and entry_round:
                if entry_round > self.highest_strategy_phase_round:
                    self.highest_strategy_phase_round = entry_round

            # Handle Setup as Round 1 Strategy Phase
            if entry_phase == 'SETUP':
                if 1 > self.highest_strategy_phase_round:
                    self.highest_strategy_phase_round = 1

            # --- CAPTURE SC PICKS FROM STATE ---
            # We still capture picks whenever they occur to ensure we get the numerator correct.
            # Using effective_round ensures we pair it to the correct round bucket.
            sc_state = state.get('strategycards', {})
            if sc_state:
                for card_name, info in sc_state.items():
                    holder = info.get('faction')
                    if holder and holder in self.players:
                        combo = (effective_round, card_name, holder)
                        if combo not in seen_sc_states:
                            seen_sc_states.add(combo)
                            self.players[holder].sc_picks.append((card_name, effective_round))
                            self.sc_owners[card_name] = holder

                            # --- CAPTURE SC PICKS FROM EVENTS (Fallback/Real-time) ---
            if action in ['ASSIGN_STRATEGY_CARD', 'PICK_STRATEGY_CARD']:
                card = event.get('id') or event.get('card')
                assigned_to = event.get('assignedTo') or event.get('faction')
                if card and assigned_to and assigned_to in self.players:
                    combo = (effective_round, card, assigned_to)
                    if combo not in seen_sc_states:
                        seen_sc_states.add(combo)
                        self.players[assigned_to].sc_picks.append((card, effective_round))
                        self.sc_owners[card] = assigned_to

            # --- EVENT HANDLING ---
            fid = event.get('faction') or d.get('activePlayer')

            # --- SCORING ---
            if action == 'SCORE_OBJECTIVE':
                obj = event.get('objective')
                if fid in self.players:
                    points = get_objective_points(obj)
                    self.players[fid].total_score += points

                    if obj == "Custodians Token":
                        self.players[fid].custodians_point = True
                        self.custodians_taken = True

            elif action == 'UNSCORE_OBJECTIVE':
                obj = event.get('objective')
                if fid in self.players:
                    points = get_objective_points(obj)
                    self.players[fid].total_score -= points

            elif action == 'GAIN_RELIC':
                relic = event.get('relic')
                if relic == "Shard of the Throne" and fid in self.players:
                    self.players[fid].total_score += 1

            elif action == 'LOSE_RELIC':
                relic = event.get('relic')
                if relic == "Shard of the Throne" and fid in self.players:
                    self.players[fid].total_score -= 1

            # --- CUSTODIANS FALLBACK ---
            if action == 'CLAIM_PLANET':
                planet = event.get('planet')
                if planet == "Mecatol Rex" and not self.custodians_taken:
                    if fid in self.players:
                        self.players[fid].custodians_point = True
                        self.custodians_taken = True

            # --- TECH GAINED ---
            if action in ['ADD_TECH', 'CHOOSE_STARTING_TECH', 'RESEARCH_TECHNOLOGY']:
                tech = event.get('tech')
                if fid in self.players and tech:
                    if tech not in self.players[fid].all_techs:
                        self.players[fid].all_techs.append(tech)
                        if action != 'CHOOSE_STARTING_TECH' and tech not in self.players[fid].starting_techs:
                            self.players[fid].researched_techs.append(tech)

        # Sync Metadata
        # Use the highest round strictly found with STRATEGY (or SETUP for R1) phase.
        # Fallback: If strict parsing yields 1 (or 0) but we have SC picks in later rounds,
        # use the latest round with picks to avoid skewed stats (e.g. 460% pick rate).
        calculated_rounds = self.highest_strategy_phase_round

        # Calculate max round from picks
        max_pick_round = 0
        for p in self.players.values():
            for _, r in p.sc_picks:
                if r > max_pick_round: max_pick_round = r

        if max_pick_round > calculated_rounds:
            calculated_rounds = max_pick_round

        self.metadata['rounds'] = calculated_rounds if calculated_rounds > 0 else 1

        # Sync Techs
        for p in self.players.values():
            for t in p.starting_techs:
                if t not in p.all_techs:
                    p.all_techs.append(t)

    def determine_winner(self):
        sorted_players = sorted(self.players.values(), key=lambda x: x.total_score, reverse=True)
        if not sorted_players: return

        max_score = sorted_players[0].total_score
        potential_winners = [p for p in sorted_players if p.total_score == max_score]

        if len(potential_winners) == 1:
            potential_winners[0].is_winner = True
        else:
            best_init = 999
            winner = None
            for p in potential_winners:
                p_init = 999
                for card, owner in self.sc_owners.items():
                    if owner == p.faction:
                        val = SC_INFO.get(card, {}).get('init', 99)
                        if val < p_init: p_init = val

                if p_init < best_init:
                    best_init = p_init
                    winner = p

            if winner:
                winner.is_winner = True
            elif potential_winners:
                potential_winners[0].is_winner = True


# ==========================================
# MAIN REPORT GENERATOR
# ==========================================

def generate_report():
    files = glob.glob("*.json")
    games = []

    print(f"Found {len(files)} JSON files.")

    for f in files:
        g = TI4Game(f)
        if g.valid:
            games.append(g)

    if not games:
        print("No valid games found.")
        return

    # --- AGGREGATION ---
    all_stats = []
    sc_counts = Counter()

    # Tech Aggregation
    tech_popularity = defaultdict(int)

    game_logs_str = ""
    games.sort(key=lambda x: x.metadata['date'], reverse=True)

    for g in games:
        # Game Log
        game_logs_str += f"DATE: {g.metadata['date']} | FILE: {g.metadata['id']}\n"
        game_logs_str += f"GOAL: {g.metadata['vp_goal']} VP | ROUNDS: {g.metadata['rounds']}\n"
        game_logs_str += "-" * 60 + "\n"

        g_players = sorted(g.players.values(), key=lambda x: x.total_score, reverse=True)

        for p in g_players:
            all_stats.append({
                'Player': p.name,
                'Faction': p.faction,
                'GameID': g.metadata['id'],
                'VP_Goal': g.metadata['vp_goal'],
                'Win': 1 if p.is_winner else 0,
                'Score': p.total_score,
                'Custodians': 1 if p.custodians_point else 0,
            })

            # SC Stats
            for card, rnd in p.sc_picks:
                sc_counts[card] += 1

            # Tech Stats
            for t in p.all_techs:
                tech_popularity[t] += 1

            win_mark = " [WINNER]" if p.is_winner else ""
            game_logs_str += f"{p.total_score:>2} VP | {p.name} ({p.faction}){win_mark}\n"

        game_logs_str += "\n"

    # --- DATAFRAMES ---
    if all_stats:
        df = pd.DataFrame(all_stats)
    else:
        df = pd.DataFrame(columns=['Player', 'Faction', 'GameID', 'VP_Goal', 'Win', 'Score', 'Custodians'])

    # 1. PLAYER REPORT
    if not df.empty:
        p_grp = df.groupby('Player')
        p_rep = pd.DataFrame({
            'Games': p_grp['GameID'].count(),
            'Wins': p_grp['Win'].sum(),
            'Win Rate': (p_grp['Win'].mean() * 100).round(1).astype(str) + '%',
            'Custodians %': (p_grp['Custodians'].mean() * 100).round(1).astype(str) + '%',
        })
        # Score averages per Goal
        for goal in [10, 12, 14]:
            sub = df[df['VP_Goal'] == goal]
            if not sub.empty:
                p_rep[f'Avg ({goal})'] = sub.groupby('Player')['Score'].mean().round(1)
            else:
                p_rep[f'Avg ({goal})'] = np.nan
        p_rep = p_rep.sort_values('Wins', ascending=False).fillna("-")
    else:
        p_rep = pd.DataFrame()

    # 2. FACTION REPORT
    if not df.empty:
        f_grp = df.groupby('Faction')
        f_rep = pd.DataFrame({
            'Picks': f_grp['GameID'].count(),
            'Wins': f_grp['Win'].sum(),
            'Win Rate': (f_grp['Win'].mean() * 100).round(1).astype(str) + '%',
            'Custodians %': (f_grp['Custodians'].mean() * 100).round(1).astype(str) + '%',
        })
        for goal in [10, 12, 14]:
            sub = df[df['VP_Goal'] == goal]
            if not sub.empty:
                f_rep[f'Avg ({goal})'] = sub.groupby('Faction')['Score'].mean().round(1)
            else:
                f_rep[f'Avg ({goal})'] = np.nan
        f_rep = f_rep.sort_values('Wins', ascending=False).fillna("-")
    else:
        f_rep = pd.DataFrame()

    # 3. SC REPORT
    sc_rows = []
    # Denominator: Sum of "Strategy Rounds" across all games
    total_rounds = sum(g.metadata['rounds'] for g in games)

    for card in sorted(SC_INFO.keys(), key=lambda x: SC_INFO[x]['init']):
        count = sc_counts[card]
        rate = (count / total_rounds * 100) if total_rounds > 0 else 0.0
        sc_rows.append({
            'Card': card,
            'Picks': count,
            'Pick Rate': f"{rate:.1f}%"
        })
    df_sc = pd.DataFrame(sc_rows)

    # 4. TECH REPORT
    tech_lists = {
        "Blue": [], "Green": [], "Red": [], "Yellow": [], "Unit": []
    }
    top_overall = sorted(tech_popularity.items(), key=lambda x: x[1], reverse=True)[:5]

    for t, count in tech_popularity.items():
        clean_t = t.replace(" (Ω)", "").strip()
        cat = TECH_DB.get(clean_t, "Other")
        if cat == "Other" and " II" in clean_t: cat = "Unit"

        if cat in tech_lists:
            tech_lists[cat].append((clean_t, count))

    for cat in tech_lists:
        tech_lists[cat].sort(key=lambda x: x[1], reverse=True)

    # ==========================
    # WRITE OUTPUT
    # ==========================
    with open('ti4_analytics_report.txt', 'w', encoding='utf-8') as f:
        f.write("TWILIGHT IMPERIUM 4 - ANALYTICS REPORT\n")
        f.write(f"Generated on: {datetime.now()}\n")
        f.write("=" * 80 + "\n\n")

        f.write("--- PLAYER STATISTICS ---\n")
        f.write(p_rep.to_string())
        f.write("\n\n")

        f.write("--- FACTION STATISTICS ---\n")
        f.write(f_rep.to_string())
        f.write("\n\n")

        f.write("--- STRATEGY CARD POPULARITY ---\n")
        f.write(f"(Based on {total_rounds} total strategy rounds played)\n")
        if not df_sc.empty:
            f.write(df_sc.to_string(index=False))
        else:
            f.write("No SC data found.")
        f.write("\n\n")

        f.write("--- TECHNOLOGY POPULARITY ---\n")
        f.write(f"Top 5 Overall: {', '.join([f'{t[0]} ({t[1]})' for t in top_overall])}\n\n")

        for cat in ["Blue", "Green", "Red", "Yellow", "Unit"]:
            f.write(f"Top {cat}:\n")
            if not tech_lists[cat]:
                f.write("  None\n")
            for t_name, t_count in tech_lists[cat][:10]:
                f.write(f"  - {t_name:<25} {t_count}\n")
            f.write("\n")

        f.write("--- GAME LOGS ---\n")
        f.write(game_logs_str)

    # Save CSV
    df.to_csv('ti4_master_data.csv', index=False)
    print("Success! Report saved.")


if __name__ == "__main__":
    generate_report()