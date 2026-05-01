import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { generateJson } from '@/lib/gemini';
import { TAPE_PROMPT } from '@/lib/prompts';
import { getCalendarData } from '@/lib/google';
import { TapeData } from '@/types';

const roleFromSelection = (
  challengerSelectedRole: 'MANAGER' | 'IC' | undefined,
  opponentSelectedRole: 'MANAGER' | 'IC' | undefined
): { challengerRole: 'MANAGER' | 'IC'; opponentRole: 'MANAGER' | 'IC' } => {
  const challengerRole = challengerSelectedRole ?? 'MANAGER';
  const opponentRole = opponentSelectedRole ?? (challengerRole === 'MANAGER' ? 'IC' : 'MANAGER');
  if (challengerRole === opponentRole) {
    return { challengerRole, opponentRole: challengerRole === 'MANAGER' ? 'IC' : 'MANAGER' };
  }
  return { challengerRole, opponentRole };
};

const summarizeEvents = (events: any[]) =>
  events.slice(0, 15).map((e, idx) => ({
    idx: idx + 1,
    summary: e.summary || 'Busy',
    start: e.start,
    end: e.end,
    attendeesCount: e.attendeesCount ?? 0,
    isRecurring: !!e.isRecurring,
  }));

const fallbackEntries = (events: any[]) =>
  events.slice(0, 5).map((e) => String(e.summary || 'Busy block'));

const withGuaranteedCalendarEntries = (tape: TapeData, calA: any[], calB: any[]) => {
  if (!Array.isArray(tape.challengerCard.calendarEntries) || tape.challengerCard.calendarEntries.length === 0) {
    tape.challengerCard.calendarEntries = fallbackEntries(calA);
  }
  if (!Array.isArray(tape.opponentCard.calendarEntries) || tape.opponentCard.calendarEntries.length === 0) {
    tape.opponentCard.calendarEntries = fallbackEntries(calB);
  }
  if (!Array.isArray(tape.challengerCard.signatureMoves) || tape.challengerCard.signatureMoves.length === 0) {
    tape.challengerCard.signatureMoves = ['THE CALENDAR CLINCH - Blocks out time with ruthless precision'];
  }
  if (!Array.isArray(tape.opponentCard.signatureMoves) || tape.opponentCard.signatureMoves.length === 0) {
    tape.opponentCard.signatureMoves = ['THE SLOT SNATCH - Grabs openings before anyone notices'];
  }
  return tape;
};

export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight || !fight.opponent) {
    return NextResponse.json({ error: 'Fight not ready' }, { status: 400 });
  }

  if (fight.tapeData) {
    return NextResponse.json(fight.tapeData);
  }

  // Fetch real calendar data
  const calA = await getCalendarData(fight.challenger.tokens);
  const calB = await getCalendarData(fight.opponent.tokens);
  const roles = roleFromSelection(fight.config.challengerSelectedRole, fight.config.opponentSelectedRole);

  // Generate Tape
  const prompt = `
  Challenger (${fight.challenger.name}) assigned role: ${roles.challengerRole}
  Challenger events (real data):
  ${JSON.stringify(summarizeEvents(calA))}
  
  Opponent (${fight.opponent.name}) assigned role: ${roles.opponentRole}
  Opponent events (real data):
  ${JSON.stringify(summarizeEvents(calB))}
  
  ${TAPE_PROMPT}
  `;

  const tapeJson = await generateJson(prompt);
  if (tapeJson) {
    tapeJson.challengerCard.role = roles.challengerRole;
    tapeJson.opponentCard.role = roles.opponentRole;
    const normalized = withGuaranteedCalendarEntries(tapeJson as TapeData, calA, calB);
    // Attach raw events hidden from frontend
    normalized.challengerCard.rawEvents = calA;
    normalized.opponentCard.rawEvents = calB;
    
    fight.tapeData = normalized;
    setFight(fight.id, fight);
    return NextResponse.json(normalized);
  }

  const fallbackTape: TapeData = {
    rationale: 'Both calendars loaded, so roles are locked from player selection and the ring proceeds with real schedule context.',
    challengerCard: {
      role: roles.challengerRole,
      archetype: roles.challengerRole === 'MANAGER' ? 'THE CALENDAR COMMANDER' : 'THE FOCUS DEFENDER',
      record: '0-0',
      calendarEntries: fallbackEntries(calA),
      signatureMoves: ['THE SLOT LOCK - Defends critical time blocks from disruption'],
      rawEvents: calA,
    },
    opponentCard: {
      role: roles.opponentRole,
      archetype: roles.opponentRole === 'MANAGER' ? 'THE TIMELINE GENERAL' : 'THE DEEP WORK GUARDIAN',
      record: '0-0',
      calendarEntries: fallbackEntries(calB),
      signatureMoves: ['THE COUNTER-SYNC - Counters proposed times with live conflicts'],
      rawEvents: calB,
    },
  };
  fight.tapeData = fallbackTape;
  setFight(fight.id, fight);
  return NextResponse.json(fallbackTape);
}
