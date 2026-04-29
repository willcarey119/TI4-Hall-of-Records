import json
import pandas as pd
import glob
import os
from collections import defaultdict, Counter
from datetime import datetime
from enum import Enum

# ==========================================
# SECTION 1: CONSTANTS & GAME DATA
# ==========================================

# --- STRATEGY CARD INITIATIVES ---
# Used for Tie-Breakers
SC_INITIATIVES = {
    "Leadership": 1,
    "Diplomacy": 2,
    "Politics": 3,
    "Construction": 4,
    "Trade": 5,
    "Warfare": 6,
    "Technology": 7,
    "Imperial": 8
}

# --- OBJECTIVE VALUES & TYPES ---

# STAGE 1 (1 Point)
POK_STAGE_1 = {
    "Corner the Market", "Develop Weaponry", "Diversify Research", "Erect a Monument",
    "Expand Borders", "Found Research Outposts", "Intimidate Council", "Lead from the Front",
    "Negotiate Trade Routes", "Sway the Council", "Amass Wealth", "Build Defenses",
    "Discover Lost Outposts", "Engineer a Marvel", "Explore Deep Space", "Improve Infrastructure",
    "Make History", "Populate the Outer Rim", "Push Boundaries", "Raise a Fleet"
}

# STAGE 2 (2 Points)
POK_STAGE_2 = {
    "Centralize Galactic Trade", "Conquer the Weak", "Form a Spy Network", "Found a Golden Age",
    "Galvanize the People", "Manipulate Galactic Law", "Master the Sciences", "Subdue the Galaxy",
    "Unify the Colonies", "Win the Structures", "Achieve Supremacy", "Become a Legend",
    "Command an Armada", "Control the Borderland", "Defy Space and Time", "Destroy Their Greatest Ship",
    "Hold Vast Reserves", "Patrol Vast Territories", "Protect the Border", "Reclaim Ancient Monuments",
    "Revolutionize Warfare", "Rule Distant Lands"
}

# SECRET OBJECTIVES (1 Point)
POK_SECRETS = {
    "Adapt New Strategies", "Become the Gatekeeper", "Control the Region", "Cut Supply Lines",
    "Establish a Perimeter", "Forging an Alliance", "Form a Spy Network", "Fuel the War Machine",
    "Gather a Mighty Host", "Learn the Secrets of the Cosmos", "Master the Laws of Physics",
    "Mine Rare Metals", "Monopolize Production", "Occupy the Seat of the Empire",
    "Threaten Enemies", "Turn Their Fleets to Dust", "Unveil Flagship", "Win a Space Battle"
}

# Known fixed point sources for classification
RELIC_NAMES = {"Shard of the Throne", "Crown of Emphidia", "Obsidian"}
AGENDA_POINTS = {"Seed of an Empire", "Mutiny"}


def get_objective_info(objective_name):
    """
    Returns (points, type_enum_string)
    """
    if objective_name in POK_STAGE_2:
        return 2, "Stage 2 Public"
    elif objective_name in POK_STAGE_1:
        return 1, "Stage 1 Public"
    elif objective_name in POK_SECRETS:
        return 1, "Secret Objective"
    return None, None


# ==========================================
# SECTION 2: ANALYTICS ENGINE
# ==========================================

class PointSource(Enum):
    STAGE_1 = "Stage 1 Public"
    STAGE_2 = "Stage 2 Public"
    SECRET = "Secret Objective"
    SUPPORT = "Support for the Throne"
    CUSTODIANS = "Custodians"
    IMPERIAL_MECATOL = "Imperial (Mecatol)"
    IMPERIAL_POINT = "Imperial (Point)"
    RELIC = "Relic"
    AGENDA = "Agenda"
    HERO = "Hero"
    UNKNOWN = "Other"


class GameParser:
    def __init__(self, file_path):
        self.file_path = file_path
        self.file_name = os.path.basename(file_path)
        self.data = None
        self.action_log = []
        self.valid = False
        self.metadata = {}

        # State Tracking
        self.factions = {}  # {faction_id: PlayerObject}
        self.planet_owners = {}
        self.sc_holders = {}  # {Card Name: Faction ID}
        self.active_imperial = False
        self.custodians_scored = False
        self.current_round = 1
        self.starting_speaker_slot = -1

        self._load_file()

    def _load_file(self):
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)

            if 'actionLog' not in content or 'data' not in content:
                return

            self.raw_data = content['data']

            # SORTING: Fix Chronological Order (Oldest -> Newest)
            self.action_log = sorted(
                content['actionLog'],
                key=lambda x: x.get('timestampMillis') or x.get('data', {}).get('timestamp', 0)
            )

            self._parse_metadata(content)
            self._init_factions()
            self.valid = True

        except Exception as e:
            print(f"Error loading {self.file_name}: {e}")

    def _parse_metadata(self, content):
        """Extracts high level game settings."""
        options = self.raw_data.get('options', {})

        # Timestamp logic
        ts = 0
        if self.action_log:
            first_log = self.action_log[0]
            ts = first_log.get('timestampMillis') or first_log.get('data', {}).get('timestamp', 0)

        try:
            date_str = datetime.fromtimestamp(ts / 1000.0).strftime('%Y-%m-%d')
        except:
            date_str = "Unknown"

        self.metadata = {
            'game_id': self.file_name,
            'date': date_str,
            'vp_goal': options.get('victory-points', 10),
            'map_style': options.get('map-style', 'standard'),
            'expansions': options.get('expansions', []),
            'duration_rounds': 0,
            'winner': None
        }

    def _init_factions(self):
        """Initialize player objects."""
        raw_factions = self.raw_data.get('factions', [])
        speaker_idx = self.raw_data.get('speaker', 0)

        for idx, f in enumerate(raw_factions):
            fid = f['id']
            name = f.get('playerName', 'Unknown')
            color = f.get('color', 'Gray')

            p = PlayerSession(fid, name, color)

            if idx == speaker_idx:
                p.started_as_speaker = True
                self.starting_speaker_slot = idx

            start_planets = f.get('planets', [])
            if isinstance(start_planets, list):
                for planet in start_planets:
                    self.planet_owners[planet] = fid
            elif isinstance(start_planets, dict):
                for planet in start_planets.keys():
                    self.planet_owners[planet] = fid

            self.factions[fid] = p

    def process_log(self):
        """Main event loop."""
        if not self.valid: return

        for entry in self.action_log:
            data = entry.get('data', {})
            action = data.get('action')
            event = data.get('event', {})

            # Update Round
            if 'state' in entry:
                self.current_round = entry['state'].get('round', self.current_round)

            # --- Event Dispatcher ---
            if action == 'SCORE_OBJECTIVE':
                self._handle_scoring(event, data)
            elif action == 'UNSCORE_OBJECTIVE':
                self._handle_unscore(event)
            elif action == 'CLAIM_PLANET':
                self._handle_planet_claim(event)
            elif action == 'SELECT_ACTION':
                self._handle_strategy_pop(event, data)
            elif action == 'GAIN_RELIC':
                self._handle_relic(event)
            elif action == 'CHOOSE_SUB_FACTION':
                self._handle_subfaction(event)
            elif action in ['CHOOSE_STARTING_TECH', 'ADD_TECH']:
                self._handle_tech(event)
            elif action in ['ASSIGN_STRATEGY_CARD', 'PICK_STRATEGY_CARD']:
                self._handle_sc_pick(event)
            elif action == 'PLAY_ACTION_CARD':
                self._handle_ac_play(event, data)

            if action in ['END_TURN', 'PASS_TURN']:
                self.active_imperial = False

        self._finalize_stats()

    # --- Handlers ---

    def _handle_scoring(self, event, data):
        fid = event.get('faction')
        objective = event.get('objective')

        # 1. Check Constants for Points/Type
        points, obj_type_str = get_objective_info(objective)

        # 2. Defaults if not found in lookup
        if points is None: points = 1

        if fid not in self.factions: return
        player = self.factions[fid]

        # 3. Determine Source Enum
        source = PointSource.UNKNOWN

        if objective == "Support for the Throne":
            source = PointSource.SUPPORT
        elif objective in RELIC_NAMES:
            source = PointSource.RELIC
        elif objective in AGENDA_POINTS:
            source = PointSource.AGENDA
        elif self.active_imperial and (objective not in ["Support for the Throne"] and objective not in RELIC_NAMES):
            source = PointSource.IMPERIAL_POINT
            # Imperial scoring is always 1 point, regardless of the objective's face value
            points = 1
        elif obj_type_str == "Stage 2 Public":
            source = PointSource.STAGE_2
        elif obj_type_str == "Stage 1 Public":
            source = PointSource.STAGE_1
        elif obj_type_str == "Secret Objective":
            source = PointSource.SECRET
        else:
            # Fallback heuristic
            source = PointSource.STAGE_1

        player.add_points(points, source, objective)

    def _handle_unscore(self, event):
        fid = event.get('faction')
        objective = event.get('objective')
        if fid in self.factions:
            self.factions[fid].remove_points(objective)

    def _handle_planet_claim(self, event):
        fid = event.get('faction')
        planet = event.get('planet')
        if fid and planet:
            self.planet_owners[planet] = fid
            if planet == "Mecatol Rex" and not self.custodians_scored:
                self.custodians_scored = True
                if fid in self.factions:
                    self.factions[fid].add_points(1, PointSource.CUSTODIANS, "Custodians Token")

    def _handle_strategy_pop(self, event, data):
        action = event.get('action')
        if action == 'Imperial':
            self.active_imperial = True
            fid = event.get('faction') or data.get('activePlayer')
            if not fid and 'Imperial' in self.sc_holders:
                fid = self.sc_holders['Imperial']
            if fid and fid in self.factions:
                if self.planet_owners.get("Mecatol Rex") == fid:
                    self.factions[fid].add_points(1, PointSource.IMPERIAL_MECATOL, "Imperial Rider")

    def _handle_relic(self, event):
        fid = event.get('faction')
        relic = event.get('relic')
        if fid in self.factions and relic in RELIC_NAMES:
            self.factions[fid].add_points(1, PointSource.RELIC, relic)

    def _handle_subfaction(self, event):
        fid = event.get('faction')
        sub = event.get('subFaction')
        if fid in self.factions and sub:
            self.factions[fid].faction_name = f"{fid} ({sub})"

    def _handle_tech(self, event):
        fid = event.get('faction')
        tech = event.get('tech')
        if fid in self.factions and tech:
            self.factions[fid].techs.append(tech)

    def _handle_sc_pick(self, event):
        card = event.get('card') or event.get('strategyCard')
        fid = event.get('faction')
        if card and fid:
            self.sc_holders[card] = fid
            if fid in self.factions:
                self.factions[fid].sc_picks.append(card)

    def _handle_ac_play(self, event, data):
        fid = event.get('faction') or data.get('activePlayer')
        if fid in self.factions:
            self.factions[fid].ac_played_count += 1

    def _finalize_stats(self):
        self.metadata['duration_rounds'] = self.current_round

        # 1. Find Max Score
        max_score = -1
        for p in self.factions.values():
            if p.total_score > max_score:
                max_score = p.total_score

        # 2. Find Candidates (Everyone with max score)
        candidates = [p for p in self.factions.values() if p.total_score == max_score]

        winner = None

        if len(candidates) == 1:
            winner = candidates[0]
        elif len(candidates) > 1:
            # 3. Tie Breaker: Initiative (Lower is better)
            best_init = 99

            for cand in candidates:
                # Find the Strategy Card this candidate holds in the FINAL round
                player_cards = [card for card, holder_id in self.sc_holders.items() if holder_id == cand.faction_id]

                local_best_init = 99
                for card in player_cards:
                    # Use direct dictionary access since we are in the same file now
                    init_val = SC_INITIATIVES.get(card, 99)
                    if init_val < local_best_init:
                        local_best_init = init_val

                if local_best_init < best_init:
                    best_init = local_best_init
                    winner = cand

        if winner:
            winner.is_winner = True
            self.metadata['winner'] = winner.faction_name


class PlayerSession:
    def __init__(self, faction_id, player_name, color):
        self.faction_id = faction_id
        self.faction_name = faction_id
        self.player_name = player_name
        self.color = color

        self.total_score = 0
        self.is_winner = False
        self.started_as_speaker = False

        self.techs = []
        self.sc_picks = []
        self.ac_played_count = 0

        self.points_log = []
        self.points_by_source = defaultdict(int)

    def add_points(self, amount, source, name):
        self.total_score += amount
        self.points_by_source[source] += amount
        self.points_log.append({
            'source': source.value,
            'name': name,
            'amount': amount
        })

    def remove_points(self, objective_name):
        for i, p in enumerate(self.points_log):
            if p['name'] == objective_name:
                self.total_score -= p['amount']
                self.points_by_source[PointSource(p['source'])] -= p['amount']
                self.points_log.pop(i)
                break


# --- Main Execution ---

def run_analysis():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_pattern = os.path.join(script_dir, "*.json")
    file_list = glob.glob(json_pattern)

    games_data = []
    player_rows = []

    print(f"Processing {len(file_list)} files...")

    for file_path in file_list:
        parser = GameParser(file_path)
        parser.process_log()

        if not parser.valid: continue

        games_data.append(parser.metadata)

        for p in parser.factions.values():
            row = {
                'Game_ID': parser.metadata['game_id'],
                'Date': parser.metadata['date'],
                'VP_Goal': parser.metadata['vp_goal'],
                'Expansions': ", ".join(parser.metadata['expansions']),
                'Player_Name': p.player_name,
                'Faction': p.faction_name,
                'Is_Winner': p.is_winner,
                'Started_Speaker': p.started_as_speaker,
                'Total_Score': p.total_score,
                'Tech_Count': len(p.techs),
                'AC_Played': p.ac_played_count,
                'Pts_Public': p.points_by_source[PointSource.STAGE_1] + p.points_by_source[PointSource.STAGE_2],
                'Pts_Secret': p.points_by_source[PointSource.SECRET],
                'Pts_Support': p.points_by_source[PointSource.SUPPORT],
                'Pts_Custodians': p.points_by_source[PointSource.CUSTODIANS],
                'Pts_Imperial': p.points_by_source[PointSource.IMPERIAL_MECATOL] + p.points_by_source[
                    PointSource.IMPERIAL_POINT],
                'Pts_Relic': p.points_by_source[PointSource.RELIC],
                'Pts_Other': p.points_by_source[PointSource.UNKNOWN]
            }
            player_rows.append(row)

    df_players = pd.DataFrame(player_rows)

    if not df_players.empty:
        print("\n--- FACTION WIN RATES ---")
        win_rates = df_players.groupby('Faction').agg({'Game_ID': 'count', 'Is_Winner': 'sum'})
        win_rates['Win %'] = (win_rates['Is_Winner'] / win_rates['Game_ID'] * 100).round(1)
        print(win_rates.sort_values('Win %', ascending=False).to_string())

        print("\n--- AVERAGE GUAC (Non-Objective Points) ---")
        guac_cols = ['Pts_Support', 'Pts_Custodians', 'Pts_Imperial', 'Pts_Relic']
        print(df_players[guac_cols].mean().round(2))

        df_players.to_csv('ti4_master_data.csv', index=False)
        print(f"\nSaved processed data to ti4_master_data.csv")
    else:
        print("No valid game data found.")


if __name__ == "__main__":
    run_analysis()