import { NextRequest, NextResponse } from 'next/server';
import { getFight } from '@/lib/fightStore';
import { getSessionStore } from '@/lib/sessionStore';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

function getOAuthClient(tokens: any) {
  const origin = process.env.NODE_ENV === 'production'
    ? 'https://calendar-combat.onrender.com'
    : 'http://localhost:3000';
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/auth/google/callback`
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session?.tokens) return NextResponse.json({ error: 'No tokens' }, { status: 401 });

  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  const { dateTime, durationMinutes, subject } = await req.json();

  const startTime = new Date(dateTime);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  // Collect attendee emails
  const attendees = [
    { email: fight.challenger.email },
    ...(fight.opponent ? [{ email: fight.opponent.email }] : []),
  ];

  try {
    const auth = getOAuthClient(session.tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all', // sends email invites to all attendees
      requestBody: {
        summary: subject || fight.config.subject,
        description: `Scheduled via Calendar Combat.\nFight ID: ${params.fightId}\nImportance: ${fight.config.importance || 'medium'}`,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees,
      },
    });

    return NextResponse.json({ success: true, eventId: event.data.id, link: event.data.htmlLink });
  } catch (err: any) {
    console.error('Calendar insert error:', err?.message);
    return NextResponse.json({ error: 'Failed to create event', detail: err?.message }, { status: 500 });
  }
}
