import { NextRequest, NextResponse } from 'next/server';
import { getSessionStore } from '@/lib/sessionStore';
import { getFightStore } from '@/lib/fightStore';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const body = await req.json();
  const fightId = randomUUID().substring(0, 8); // Short ID for shareability

  getFightStore().set(fightId, {
    id: fightId,
    challenger: session,
    config: {
      subject: body.subject,
      durationMinutes: parseInt(body.durationMinutes),
      urgency: body.urgency,
      description: body.description,
    },
    status: 'waiting',
    transcript: [],
    readyCount: 0
  });

  return NextResponse.json({ fightId });
}
