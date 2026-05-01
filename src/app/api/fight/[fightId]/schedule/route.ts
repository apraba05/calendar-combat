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

function getGoogleErrorDetail(err: any): string {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.error_description ||
    err?.message ||
    'Unknown Google API error'
  );
}

function parseRequestedDateTime(value: string): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Accept "YYYY-MM-DD HH:mm" and "YYYY-MM-DDTHH:mm"
  const normalized = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = getSessionStore().get(sessionId);
  if (!session?.tokens) return NextResponse.json({ error: 'No tokens' }, { status: 401 });

  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  const { dateTime, durationMinutes } = await req.json();
  const startTime = parseRequestedDateTime(dateTime);
  if (!startTime) {
    return NextResponse.json({ error: 'Invalid meeting time' }, { status: 400 });
  }
  const duration = Number(durationMinutes || fight.config.durationMinutes || 30);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Collect attendee emails
  const attendees = [
    { email: fight.challenger.email },
    ...(fight.opponent ? [{ email: fight.opponent.email }] : []),
  ];

  try {
    const auth = getOAuthClient(session.tokens);
    await auth.getAccessToken();
    const refreshed = auth.credentials;
    if (refreshed?.access_token && refreshed.access_token !== session.tokens?.access_token) {
      getSessionStore().set(sessionId, {
        ...session,
        tokens: {
          ...session.tokens,
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token ?? session.tokens?.refresh_token,
          expiry_date: refreshed.expiry_date ?? session.tokens?.expiry_date,
        },
      });
    }
    const calendar = google.calendar({ version: 'v3', auth });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all', // sends email invites to all attendees
      requestBody: {
        summary: fight.config.subject,
        description: `Scheduled via Calendar Combat.\nFight ID: ${params.fightId}\nImportance: ${fight.config.importance || 'medium'}`,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.data.id,
      link: event.data.htmlLink,
      scheduledStart: startTime.toISOString(),
      scheduledEnd: endTime.toISOString(),
    });
  } catch (err: any) {
    const detail = getGoogleErrorDetail(err);
    console.error('Calendar insert error:', detail);
    if (/insufficient|scope|invalid.?grant|unauthorized/i.test(detail)) {
      return NextResponse.json(
        { error: 'Google authorization expired or missing calendar write permission. Please reconnect Google and try again.', detail },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Failed to create event', detail }, { status: 500 });
  }
}
