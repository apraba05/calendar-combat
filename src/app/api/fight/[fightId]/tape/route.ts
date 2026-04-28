import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { generateJson } from '@/lib/gemini';
import { TAPE_PROMPT } from '@/lib/prompts';
import { getCalendarData } from '@/lib/google';

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

  // Generate Tape
  const prompt = `
  Challenger (${fight.challenger.name}) Events:
  ${JSON.stringify(calA.slice(0, 15))}
  
  Opponent (${fight.opponent.name}) Events:
  ${JSON.stringify(calB.slice(0, 15))}
  
  ${TAPE_PROMPT}
  `;

  const tapeJson = await generateJson(prompt);
  if (tapeJson) {
    // Attach raw events hidden from frontend
    tapeJson.challengerCard.rawEvents = calA;
    tapeJson.opponentCard.rawEvents = calB;
    
    fight.tapeData = tapeJson;
    setFight(fight.id, fight);
    return NextResponse.json(tapeJson);
  }

  return NextResponse.json({ error: 'Failed to generate tape' }, { status: 500 });
}
