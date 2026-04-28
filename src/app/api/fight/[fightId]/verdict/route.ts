import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { generateJson } from '@/lib/gemini';
import { VERDICT_PROMPT } from '@/lib/prompts';
import { broadcastToChat } from '@/lib/chatBroadcast';
import { getCreateEventUrl } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (fight.verdictData) return NextResponse.json(fight.verdictData);

  const transcriptStr = fight.transcript.map(t => `${t.role}: ${t.text}`).join('\n');
  const json = await generateJson(`${VERDICT_PROMPT}\n\nTranscript:\n${transcriptStr}`);

  const lastMsg = fight.transcript[fight.transcript.length - 1];
  let winnerRole: 'MANAGER' | 'IC' | 'DRAW' = 'DRAW';
  let winnerName = 'STALEMATE';
  let status = 'STALEMATE';
  let meetingTime = '';

  const agreementMatch = transcriptStr.match(/\[AGREEMENT:\s*(.+?),\s*(\d+)\]/);
  if (agreementMatch) {
    status = 'AGREEMENT REACHED';
    meetingTime = agreementMatch[1];
    winnerRole = lastMsg?.role as 'MANAGER' | 'IC';
    winnerName = winnerRole === 'MANAGER' ? 'THE MANAGER' : 'THE IC';
  } else if (transcriptStr.includes('[WALKAWAY]')) {
    status = 'WALKAWAY';
  }

  const verdict = {
    winnerRole,
    winnerName,
    stats: json?.stats || { persistence: 50, passiveAggression: 50, schedulingBrutality: 50, bccLethality: 50 },
    savageQuote: json?.savageQuote || "A shameful display of corporate cowardice.",
    meetingDetails: {
      date: meetingTime ? meetingTime.split(' ')[0] : '',
      time: meetingTime ? meetingTime.split(' ')[1] : '',
      durationMinutes: fight.config.durationMinutes,
      status
    }
  };

  fight.verdictData = verdict;
  setFight(fight.id, fight);

  if (meetingTime && fight.opponent) {
    const url = getCreateEventUrl(fight.config.subject, meetingTime, fight.config.durationMinutes, [fight.challenger.email, fight.opponent.email]);
    broadcastToChat(`The fight has concluded. ${status} at ${meetingTime}.\n\nAdd to calendar: ${url}`, "VERDICT RENDERED", "Click to Schedule");
  } else {
    broadcastToChat(`The fight ended in a bloody stalemate.`, "VERDICT RENDERED");
  }

  return NextResponse.json(verdict);
}
