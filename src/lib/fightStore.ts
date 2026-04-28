import { FightState } from '@/types';

declare global {
  var fightStore: Map<string, FightState> | undefined;
}

if (!globalThis.fightStore) {
  globalThis.fightStore = new Map<string, FightState>();
}

export const getFightStore = () => globalThis.fightStore!;

export const getFight = (id: string): FightState | undefined => {
  return getFightStore().get(id);
};

export const setFight = (id: string, state: FightState) => {
  getFightStore().set(id, state);
};
