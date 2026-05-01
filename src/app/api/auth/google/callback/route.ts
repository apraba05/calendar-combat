import { NextRequest, NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/lib/google';
import { getSessionStore } from '@/lib/sessionStore';
import { getFight, setFight } from '@/lib/fightStore';
import { pusherServer } from '@/lib/pusher';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');

  const origin = process.env.NODE_ENV === 'production' ? 'https://calendar-combat.onrender.com' : 'http://localhost:3000';

  if (!code || !stateStr) {
    return NextResponse.redirect(`${origin}/`);
  }

  try {
    const state = JSON.parse(Buffer.from(stateStr, 'base64').toString('ascii'));
    const tokens = await getTokens(code, req);
    const userInfo = await getUserInfo(tokens);

    const sessionId = randomUUID();
    getSessionStore().set(sessionId, {
      id: sessionId,
      email: userInfo.email || 'unknown@example.com',
      name: userInfo.name || 'Fighter',
      avatar: userInfo.avatar || '',
      tokens,
    });

    let redirectPath = state.action === 'join' ? `/fight/${state.fightId}/join` : '/fight/new';

    if (state.action === 'join' && state.fightId) {
      const fight = getFight(state.fightId);
      if (fight) {
        if (fight.challenger.email !== (userInfo.email || '')) {
          fight.opponent = { id: sessionId, email: userInfo.email || 'unknown@example.com', name: userInfo.name || 'Fighter', avatar: userInfo.avatar || '', tokens };
          fight.status = 'priorities';
          fight.config.opponentPersona = state.persona || 'ic';
          fight.priorityCount = 0;
          setFight(state.fightId, fight);
          if (pusherServer) {
            pusherServer.trigger(`fight-${state.fightId}`, 'opponent-joined', {});
          }
        }
        redirectPath = `/fight/${state.fightId}/priorities`;
      }
    }

    const res = NextResponse.redirect(`${origin}${redirectPath}`);
    res.cookies.set('sessionId', sessionId, { path: '/', httpOnly: true });

    return res;
  } catch (e) {
    console.error("OAuth callback error", e);
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }
}
