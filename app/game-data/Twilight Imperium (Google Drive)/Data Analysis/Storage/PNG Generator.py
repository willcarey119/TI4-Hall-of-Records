import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set style
sns.set_theme(style="whitegrid")

# --- DATA ---
players_data = {
    'Player': ['Steve', 'Ben', 'Paul', 'Mark', 'KP', 'Chris', 'Mikey', 'Merrill', 'TK', 'Tanya', 'Tanys', 'Tim', 'Will', 'Zach'],
    'Games': [4, 2, 3, 1, 2, 2, 2, 1, 1, 1, 1, 3, 5, 1],
    'Wins': [3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Win_Rate': [75.0, 50.0, 33.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

guac_data = {
    'Category': ['Secrets', 'Support', 'Imp. Obj.', 'Custodians', 'Relics'],
    'Avg_Points': [2.83, 0.90, 0.86, 0.17, 0.03]
}

# --- PLOT 1: Player Win Rates ---
df_players = pd.DataFrame(players_data).sort_values('Win_Rate', ascending=True)
plt.figure(figsize=(10, 6))
colors = ['#d3d3d3' if x == 0 else '#4c72b0' for x in df_players['Win_Rate']]
bars = plt.barh(df_players['Player'], df_players['Win_Rate'], color=colors)
plt.xlabel('Win Rate (%)')
plt.title('TI4 Player Win Rates (Processed: 5 Files)')
plt.xlim(0, 100)
# Add labels
for bar in bars:
    if bar.get_width() > 0:
        plt.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2,
                 f"{int(bar.get_width())}%", va='center')
plt.tight_layout()
plt.show()

# --- PLOT 2: Guac Points ---
df_guac = pd.DataFrame(guac_data).sort_values('Avg_Points', ascending=False)
plt.figure(figsize=(8, 5))
sns.barplot(x='Avg_Points', y='Category', data=df_guac, palette="viridis")
plt.title('Average "Guac Points" Per Game (By Source)')
plt.xlabel('Average Points Scored')
plt.tight_layout()
plt.show()