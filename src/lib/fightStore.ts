import { FightState } from '@/types';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'fightStore.json');

const readDb = (): Map<string, FightState> => {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return new Map(Object.entries(JSON.parse(data)));
    }
  } catch (e) {}
  return new Map<string, FightState>();
};

const writeDb = (map: Map<string, FightState>) => {
  fs.writeFileSync(dbPath, JSON.stringify(Object.fromEntries(map)));
};

export const getFightStore = () => readDb();

export const getFight = (id: string): FightState | undefined => {
  return readDb().get(id);
};

export const setFight = (id: string, state: FightState) => {
  const map = readDb();
  map.set(id, state);
  writeDb(map);
};
