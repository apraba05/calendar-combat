import { google } from 'googleapis';
import { addDays } from 'date-fns';
import { CalendarEvent } from '@/types';


export const getAuthUrl = (state: string, req: any) => {
  const origin = req.headers.get('origin') || req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    state,
  });
};

export const getTokens = async (code: string, req: any) => {
  const origin = req.headers.get('origin') || req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const getUserInfo = async (tokens: any) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "" // doesn't matter for userinfo
  );
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const { data } = await oauth2.userinfo.get();
  return { email: data.email, name: data.name, avatar: data.picture };
};

export const getCalendarData = async (tokens: any): Promise<CalendarEvent[]> => {
  if (process.env.DEMO_MODE === 'true') {
    return []; // We will inject fake data directly in the route if demo mode is on
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    ""
  );
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const now = new Date();
  const twoWeeks = addDays(now, 14);

  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: twoWeeks.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = res.data.items || [];
    return items.map(e => ({
      id: e.id!,
      summary: e.summary || 'Busy',
      start: new Date(e.start?.dateTime || e.start?.date || now),
      end: new Date(e.end?.dateTime || e.end?.date || now),
      isRecurring: !!e.recurringEventId,
      attendeesCount: e.attendees?.length || 0,
    }));
  } catch (e) {
    console.error("Calendar fetch error:", e);
    return [];
  }
};

export const validateProposal = (timeStr: string, durationMin: number, eventsA: CalendarEvent[], eventsB: CalendarEvent[]): boolean => {
  if (process.env.DEMO_MODE === 'true') return true; 

  try {
    const propStart = new Date(timeStr);
    const propEnd = new Date(propStart.getTime() + durationMin * 60000);

    const checkConflict = (events: CalendarEvent[]) => {
      return events.some(e => {
        return (propStart < e.end && propEnd > e.start);
      });
    };

    return !checkConflict(eventsA) && !checkConflict(eventsB);
  } catch (e) {
    return false;
  }
};

export const getCreateEventUrl = (title: string, startStr: string, durationMin: number, guests: string[]) => {
  const start = new Date(startStr);
  const end = new Date(start.getTime() + durationMin * 60000);
  
  const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', `${format(start)}/${format(end)}`);
  url.searchParams.set('add', guests.join(','));
  return url.toString();
};
