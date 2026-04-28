import { NextRequest, NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/lib/google';
import { getSessionStore } from '@/lib/sessionStore';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');

  if (!code || !stateStr) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const state = JSON.parse(Buffer.from(stateStr, 'base64').toString('ascii'));
    const tokens = await getTokens(code);
    const userInfo = await getUserInfo(tokens);

    const sessionId = randomUUID();
    getSessionStore().set(sessionId, {
      id: sessionId,
      email: userInfo.email || 'unknown@example.com',
      name: userInfo.name || 'Fighter',
      avatar: userInfo.avatar || '',
      tokens,
    });

    const res = NextResponse.redirect(new URL(state.action === 'join' ? `/fight/${state.fightId}/join` : '/fight/new', req.url));
    res.cookies.set('sessionId', sessionId, { path: '/', httpOnly: true });
    
    return res;
  } catch (e) {
    console.error("OAuth callback error", e);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
