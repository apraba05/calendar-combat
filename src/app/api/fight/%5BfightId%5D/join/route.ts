import { NextRequest, NextResponse } from 'next/server';
import { getSessionStore } from '@/lib/sessionStore';
import { getFightStore } from '@/lib/fightStore';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const fightId = params.fightId;
  const fight = getFightStore().get(fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  if (fight.challenger.email === session.email) {
    // Challenger is rejoining their own fight, let them pass
    return NextResponse.json({ success: true });
  }

  fight.opponent = session;
  fight.status = 'tape';
  getFightStore().set(fightId, fight);

  // Notify challenger via Pusher that opponent joined
  if (pusherServer) {
    pusherServer.trigger(`fight-${fightId}`, 'opponent-joined', {});
  }

  return NextResponse.json({ success: true });
}
