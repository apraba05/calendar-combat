import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { addHistory } from '@/lib/historyStore';
import { generateJson } from '@/lib/gemini';
import { getJudgePrompt } from '@/lib/prompts';
import { broadcastToChat } from '@/lib/chatBroadcast';

export const dynamic = 'force-dynamic';
const verdictJobs = new Map<string, Promise<any>>();
const toDisplayDateTime = (value?: string | null): string | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  // Handle values like "2026-05-01T17:00" from datetime-local inputs.
  if (raw.includes('T') && !raw.includes(' ')) return raw.replace('T', ' ');
  return raw;
};

export async function GET(req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (fight.verdictData) return NextResponse.json(fight.verdictData);
  if (verdictJobs.has(fight.id)) {
    const pending = await verdictJobs.get(fight.id)!;
    return NextResponse.json(pending);
  }

  const verdictJob = (async () => {
    const latestFight = getFight(params.fightId);
    if (!latestFight) return { error: 'Not found', status: 404 };
    if (latestFight.verdictData) return latestFight.verdictData;

    const transcriptStr = latestFight.transcript
      .filter(t => t.role !== 'COMMENTATOR')
      .map(t => `${t.role}: ${t.text}`)
      .join('\n');

    const { challengerCard, opponentCard } = latestFight.tapeData || { challengerCard: null, opponentCard: null };
    const managerCard = challengerCard?.role === 'MANAGER' ? challengerCard : opponentCard;
    const icCard = challengerCard?.role === 'MANAGER' ? opponentCard : challengerCard;

    const judgePrompt = getJudgePrompt(
      latestFight.config,
      managerCard?.rawEvents || [],
      icCard?.rawEvents || [],
      latestFight.config.proposedTime
    );

    const json = await generateJson(`${judgePrompt}\n\nFULL TRANSCRIPT:\n${transcriptStr}`);

    const formatPersonaLabel = (persona?: string) => (persona || 'champion').replace(/_/g, ' ').toUpperCase();
    const managerPersona = challengerCard?.role === 'MANAGER' ? latestFight.config.challengerPersona : latestFight.config.opponentPersona;
    const icPersona = challengerCard?.role === 'IC' ? latestFight.config.challengerPersona : latestFight.config.opponentPersona;
    const ruling = json?.ruling || 'DRAW';
    const winnerName = ruling === 'MANAGER_WINS'
      ? `THE ${formatPersonaLabel(managerPersona)}`
      : ruling === 'IC_WINS'
      ? `THE ${formatPersonaLabel(icPersona)}`
      : 'DRAW';
    const winnerRole: 'MANAGER' | 'IC' | 'DRAW' = ruling === 'MANAGER_WINS' ? 'MANAGER' : ruling === 'IC_WINS' ? 'IC' : 'DRAW';

    const conflictsFound = Array.isArray(json?.conflictsFound) ? json.conflictsFound : [];
    const recommendMeeting = json?.recommendMeeting ?? false;
    const recommendedTimeFromModel = toDisplayDateTime(json?.recommendedTime || null);
    const proposedTimeFallback = toDisplayDateTime(latestFight.config.proposedTime || null);
    const recommendedTime = recommendedTimeFromModel || (recommendMeeting ? proposedTimeFallback : null);

    const verdict = {
      winnerRole,
      winnerName,
      judgeRationale: json?.rationale || 'The judge is speechless.',
      judgeQuote: json?.judgeQuote || 'A shameful display of corporate maneuvering.',
      recommendMeeting,
      recommendedTime,
      conflictsFound,
      stats: json?.stats || { persistence: 50, passiveAggression: 50, schedulingBrutality: 50, bccLethality: 50 },
      savageQuote: json?.judgeQuote || 'No comment.',
      meetingDetails: {
        date: recommendedTime ? recommendedTime.split(' ')[0] : '',
        time: recommendedTime ? recommendedTime.split(' ')[1] : '',
        durationMinutes: latestFight.config.durationMinutes,
        status: recommendMeeting ? 'MEETING RECOMMENDED' : 'NO MEETING RECOMMENDED'
      }
    };

    latestFight.verdictData = verdict as any;
    setFight(latestFight.id, latestFight);
    addHistory(latestFight);

    broadcastToChat(
      `The judge has spoken. Ruling: ${ruling}. ${verdict.meetingDetails.status}.`,
      "JUDGE'S VERDICT"
    );

    return verdict;
  })();

  verdictJobs.set(fight.id, verdictJob);
  try {
    const verdict = await verdictJob;
    if ((verdict as any)?.error) {
      return NextResponse.json({ error: (verdict as any).error }, { status: (verdict as any).status || 500 });
    }
    return NextResponse.json(verdict);
  } finally {
    verdictJobs.delete(fight.id);
  }
}
