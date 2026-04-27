// scripts/discover-data.ts
// Run with: npm run discover
// Walks all game-data JSON exports and emits every unique action name,
// objective string, tech name, and agenda name to stdout.
// Use the output to seed and verify the objectives dictionary in Task 2.

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const GAME_DATA = join(process.cwd(), 'game-data');

const actions = new Set<string>();
const objectives = new Set<string>();
const techs = new Set<string>();
const agendas = new Set<string>();
const players = new Set<string>();

const files = readdirSync(GAME_DATA).filter((f) => f.endsWith('.json'));
console.log(`Reading ${files.length} files from ${GAME_DATA}\n`);

for (const file of files) {
  const data = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));

  const factionsArr = data.factions ?? data.data?.factions;
  if (Array.isArray(factionsArr)) {
    for (const f of factionsArr) {
      if (typeof f.playerName === 'string') players.add(f.playerName);
    }
  }

  if (Array.isArray(data.actionLog)) {
    for (const entry of data.actionLog) {
      // Real exports nest the payload under entry.data; tolerate both shapes.
      const payload = entry.data ?? entry;
      if (typeof payload.action === 'string') actions.add(payload.action);
      const ev = payload.event;
      if (ev && typeof ev === 'object') {
        if (typeof ev.objective === 'string') objectives.add(ev.objective);
        if (typeof ev.tech === 'string') techs.add(ev.tech);
        if (typeof ev.agenda === 'string') agendas.add(ev.agenda);
      }
    }
  }
}

const print = (title: string, set: Set<string>) => {
  console.log(`=== ${title} (${set.size}) ===`);
  [...set].sort().forEach((s) => console.log(`  ${s}`));
  console.log();
};

print('ACTIONS', actions);
print('OBJECTIVES', objectives);
print('TECHS', techs);
print('AGENDAS', agendas);
print('PLAYER NAMES', players);
