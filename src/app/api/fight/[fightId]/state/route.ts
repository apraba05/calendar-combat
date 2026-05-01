import { NextRequest, NextResponse } from 'next/server';
import { getFight } from '@/lib/fightStore';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  return NextResponse.json({
    id: fight.id,
    status: fight.status,
    hasOpponent: !!fight.opponent,
    transcript: fight.transcript || [],
    verdictReady: !!fight.verdictData,
  });
}
