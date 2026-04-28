import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'login';
  const fightId = searchParams.get('fightId') || '';
  
  const state = Buffer.from(JSON.stringify({ action, fightId })).toString('base64');
  const url = getAuthUrl(state);
  
  return NextResponse.redirect(url);
}
