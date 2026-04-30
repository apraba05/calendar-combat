import { FightState } from '@/types';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'historyStore.json');

const readDb = (): FightState[] => {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
};

const writeDb = (arr: FightState[]) => {
  fs.writeFileSync(dbPath, JSON.stringify(arr));
};

export const getHistoryStore = () => readDb();

export const addHistory = (state: FightState) => {
  const arr = readDb();
  // Ensure we don't save duplicates if verdict is called twice
  if (!arr.find(f => f.id === state.id)) {
    arr.unshift(state); // Add to beginning (newest first)
    writeDb(arr);
  }
};
