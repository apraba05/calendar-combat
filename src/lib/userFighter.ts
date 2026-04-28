import { FighterCard, UserRecord } from '../types';

const FIGHTER_KEY = 'calendar_combat_user_fighter';
const RECORD_KEY = 'calendar_combat_user_record';

export const getUserFighter = (): FighterCard | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(FIGHTER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveUserFighter = (fighter: FighterCard) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIGHTER_KEY, JSON.stringify(fighter));
  }
};

export const getUserRecord = (): UserRecord => {
  if (typeof window === 'undefined') return { wins: 0, losses: 0, draws: 0 };
  const stored = localStorage.getItem(RECORD_KEY);
  return stored ? JSON.parse(stored) : { wins: 0, losses: 0, draws: 0 };
};

export const updateUserRecord = (result: 'win' | 'loss' | 'draw') => {
  if (typeof window === 'undefined') return;
  const record = getUserRecord();
  if (result === 'win') record.wins += 1;
  else if (result === 'loss') record.losses += 1;
  else if (result === 'draw') record.draws += 1;
  localStorage.setItem(RECORD_KEY, JSON.stringify(record));
};
