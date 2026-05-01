import { NextRequest, NextResponse } from 'next/server';
import { getSessionStore } from '@/lib/sessionStore';
import { getFightStore, getFight, setFight } from '@/lib/fightStore';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const fightId = params.fightId;
  const fight = getFight(fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  if (fight.challenger.email === session.email) {
    return NextResponse.json({ success: true });
  }

  let opponentPersona: string = 'ic';
  try {
    const body = await req.json();
    opponentPersona = body.opponentPersona || 'ic';
  } catch {}

  fight.opponent = session;
  fight.status = 'priorities';
  fight.config.opponentPersona = opponentPersona;
  fight.priorityCount = 0;
  setFight(fightId, fight);

  if (pusherServer) {
    pusherServer.trigger(`fight-${fightId}`, 'opponent-joined', {});
  }

  return NextResponse.json({ success: true });
}

