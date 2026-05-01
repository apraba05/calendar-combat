import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { addHistory } from '@/lib/historyStore';
import { generateJson } from '@/lib/gemini';
import { getJudgePrompt } from '@/lib/prompts';
import { broadcastToChat } from '@/lib/chatBroadcast';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (fight.verdictData) return NextResponse.json(fight.verdictData);

  const transcriptStr = fight.transcript
    .filter(t => t.role !== 'COMMENTATOR')
    .map(t => `${t.role}: ${t.text}`)
    .join('\n');

  const { challengerCard, opponentCard } = fight.tapeData || { challengerCard: null, opponentCard: null };
  const managerCard = challengerCard?.role === 'MANAGER' ? challengerCard : opponentCard;
  const icCard = challengerCard?.role === 'MANAGER' ? opponentCard : challengerCard;

  const judgePrompt = getJudgePrompt(
    fight.config,
    managerCard?.rawEvents || [],
    icCard?.rawEvents || [],
    fight.config.proposedTime
  );

  const json = await generateJson(`${judgePrompt}\n\nFULL TRANSCRIPT:\n${transcriptStr}`);

  const formatPersonaLabel = (persona?: string) => (persona || 'champion').replace(/_/g, ' ').toUpperCase();
  const managerPersona = challengerCard?.role === 'MANAGER' ? fight.config.challengerPersona : fight.config.opponentPersona;
  const icPersona = challengerCard?.role === 'IC' ? fight.config.challengerPersona : fight.config.opponentPersona;
  const ruling = json?.ruling || 'DRAW';
  const winnerName = ruling === 'MANAGER_WINS'
    ? `THE ${formatPersonaLabel(managerPersona)}`
    : ruling === 'IC_WINS'
    ? `THE ${formatPersonaLabel(icPersona)}`
    : 'DRAW';
  const winnerRole: 'MANAGER' | 'IC' | 'DRAW' = ruling === 'MANAGER_WINS' ? 'MANAGER' : ruling === 'IC_WINS' ? 'IC' : 'DRAW';

  const verdict = {
    winnerRole,
    winnerName,
    judgeRationale: json?.rationale || 'The judge is speechless.',
    judgeQuote: json?.judgeQuote || 'A shameful display of corporate maneuvering.',
    recommendMeeting: json?.recommendMeeting ?? false,
    recommendedTime: json?.recommendedTime || null,
    conflictsFound: json?.conflictsFound || [],
    stats: json?.stats || { persistence: 50, passiveAggression: 50, schedulingBrutality: 50, bccLethality: 50 },
    savageQuote: json?.judgeQuote || 'No comment.',
    meetingDetails: {
      date: json?.recommendedTime ? json.recommendedTime.split(' ')[0] : '',
      time: json?.recommendedTime ? json.recommendedTime.split(' ')[1] : '',
      durationMinutes: fight.config.durationMinutes,
      status: json?.recommendMeeting ? 'MEETING RECOMMENDED' : 'NO MEETING RECOMMENDED'
    }
  };

  fight.verdictData = verdict as any;
  setFight(fight.id, fight);
  addHistory(fight);

  broadcastToChat(
    `The judge has spoken. Ruling: ${ruling}. ${verdict.meetingDetails.status}.`,
    "JUDGE'S VERDICT"
  );

  return NextResponse.json(verdict);
}
