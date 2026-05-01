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
  if (!fight || !fight.verdictData) return NextResponse.json({ error: 'Fight or verdict not found' }, { status: 404 });

  const { verdict } = await req.json();

  const to = [fight.challenger.email];
  if (fight.opponent) to.push(fight.opponent.email);

  try {
    const auth = getOAuthClient(session.tokens);
    const gmail = google.gmail({ version: 'v1', auth });

    const subjectText = `Calendar Combat Verdict: ${fight.config.subject}`;
    
    // Construct the runthrough
    let transcriptText = '';
    fight.transcript.forEach(msg => {
      const name = msg.role === 'MANAGER' ? fight.challenger.name : (msg.role === 'IC' ? (fight.opponent?.name || 'Opponent') : 'Commentator');
      transcriptText += `[${name}] ${msg.text}\n\n`;
    });

    const bodyText = `
Calendar Combat Arbitration Complete
======================================
Subject: ${fight.config.subject}
Winner: ${verdict.winnerName}

Judge's Rationale:
${verdict.judgeRationale}

Quote:
"${verdict.judgeQuote}"

Recommendation: ${verdict.meetingDetails.status}
${verdict.recommendedTime ? `Proposed Time: ${verdict.recommendedTime}` : ''}

=== FIGHT TRANSCRIPT ===
${transcriptText}
`;

    const messageParts = [
      `To: ${to.join(', ')}`,
      `Subject: ${subjectText}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      bodyText,
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Gmail send error:', err?.message);
    return NextResponse.json({ error: 'Failed to send email', detail: err?.message }, { status: 500 });
  }
}
