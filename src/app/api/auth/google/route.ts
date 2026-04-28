import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';
import { getSessionStore } from '@/lib/sessionStore';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'login';
  const fightId = searchParams.get('fightId') || '';

  if (process.env.DEMO_MODE === 'true') {
    const sessionId = randomUUID();
    getSessionStore().set(sessionId, {
      id: sessionId,
      email: action === 'join' ? 'demo_ic@example.com' : 'demo_manager@example.com',
      name: action === 'join' ? 'Demo IC' : 'Demo Manager',
      avatar: '',
      tokens: { access_token: 'demo' }
    });
    const res = NextResponse.redirect(new URL(action === 'join' ? `/fight/${fightId}/join` : '/fight/new', req.url));
    res.cookies.set('sessionId', sessionId, { path: '/', httpOnly: true });
    return res;
  }

  const state = Buffer.from(JSON.stringify({ action, fightId })).toString('base64');
  const url = getAuthUrl(state);
  
  return NextResponse.redirect(url);
}
