import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { getSessionStore } from '@/lib/sessionStore';
import { getCalendarData } from '@/lib/google';
import { pusherServer } from '@/lib/pusher';

// GET — returns the current user's upcoming calendar events for prioritization
export async function GET(req: NextRequest, { params }: { params: { fightId: string } }) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  const isChallenger = fight.challenger.email === session.email;
  const user = isChallenger ? fight.challenger : fight.opponent;
  if (!user?.tokens) return NextResponse.json({ error: 'No calendar tokens' }, { status: 400 });

  const raw = await getCalendarData(user.tokens);

  const events = raw.map(e => ({
    eventId: e.id,
    summary: e.summary,
    start: e.start instanceof Date ? e.start.toISOString() : String(e.start),
    end: e.end instanceof Date ? e.end.toISOString() : String(e.end),
    isRecurring: e.isRecurring,
    attendeesCount: e.attendeesCount,
  }));

  return NextResponse.json({ events });
}

// POST — saves the user's priorities, fires Pusher when both have submitted
export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  const { priorities } = await req.json();

  const isChallenger = fight.challenger.email === session.email;
  if (isChallenger) {
    fight.config.challengerPriorities = priorities;
  } else {
    fight.config.opponentPriorities = priorities;
  }

  fight.priorityCount = (fight.priorityCount ?? 0) + 1;
  setFight(fight.id, fight);

  if (fight.priorityCount >= 2 && pusherServer) {
    pusherServer.trigger(`fight-${fight.id}`, 'priorities-complete', {});
  }

  return NextResponse.json({ waiting: fight.priorityCount < 2 });
}
