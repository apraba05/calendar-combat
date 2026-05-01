export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  tokens?: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  };
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  isRecurring: boolean;
  attendeesCount: number;
}

export interface FightConfig {
  subject: string;
  durationMinutes: number;
  urgency: 'this_week' | 'next_two_weeks' | 'flexible';
  description: string;
  proposedTime?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  opponentStance?: 'accept' | 'avoid';
  challengerPersona?: 'ic' | 'team_lead' | 'director' | 'executive';
  opponentPersona?: 'ic' | 'team_lead' | 'director' | 'executive';
}

export interface FighterCard {
  role: 'MANAGER' | 'IC';
  archetype: string;
  record: string;
  calendarEntries: string[]; // 5 dramatized entries
  signatureMoves: string[]; // 3 signature moves
  rawEvents?: CalendarEvent[]; // Hidden from opponent
}

export interface TapeData {
  challengerCard: FighterCard;
  opponentCard: FighterCard;
  rationale: string;
}

export interface ChatMessage {
  id: string;
  role: 'MANAGER' | 'IC' | 'COMMENTATOR';
  text: string;
  timestamp: string;
  subtext?: string;
}

export interface VerdictData {
  winnerRole: 'MANAGER' | 'IC' | 'DRAW';
  winnerName: string;
  stats: {
    persistence: number;
    passiveAggression: number;
    schedulingBrutality: number;
    bccLethality: number;
  };
  savageQuote: string;
  meetingDetails: {
    date: string;
    time: string;
    durationMinutes: number;
    status: string;
  };
}

export interface FightState {
  id: string;
  challenger: User;
  opponent?: User;
  config: FightConfig;
  status: 'waiting' | 'tape' | 'arena' | 'verdict';
  tapeData?: TapeData;
  transcript: ChatMessage[];
  verdictData?: VerdictData;
  readyCount: number; // for syncing transitions (e.g. both click 'ENTER ARENA')
}
