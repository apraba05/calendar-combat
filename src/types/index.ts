export interface FighterCard {
  id: string;
  name: string;
  archetype: string;
  avatarUrl: string;
  fightRecord: string;
  boutName: string;
  stats: {
    stat1Label: string;
    stat1Value: string;
  };
  calendar: string;
  preferences: string[];
  style: string;
}

export type MessageRole = 'agentA' | 'agentB' | 'commentator';

export interface CombatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
}

export interface FightState {
  matchupId: string;
  agentAId: string;
  agentBId: string;
  messages: CombatMessage[];
  status: 'ongoing' | 'finished';
  verdictData?: VerdictData;
}

export interface VerdictData {
  winner: string;
  stats: {
    persistence: number;
    passiveAggression: number;
    schedulingBrutality: number;
    bccLethality: number;
  };
  savageQuote: string;
  meetingDetails: {
    title: string;
    date: string;
    time: string;
    location: string;
    status: string;
  };
}
