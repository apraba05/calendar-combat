import { FightState } from '@/types';

declare global {
  var fightStore: Map<string, FightState> | undefined;
}

if (!globalThis.fightStore) {
  globalThis.fightStore = new Map<string, FightState>();
}

export const getStore = () => globalThis.fightStore!;
