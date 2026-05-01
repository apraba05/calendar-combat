import { NextRequest, NextResponse } from 'next/server';
import { getFight } from '@/lib/fightStore';

export async function GET(_req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight) return NextResponse.json({ error: 'Fight not found' }, { status: 404 });

  // Which role each person ended up in (resolved once tape is generated)
  const challengerRole = fight.tapeData?.challengerCard.role ?? null;

  return NextResponse.json({
    subject: fight.config.subject,
    durationMinutes: fight.config.durationMinutes,
    challengerName: fight.challenger.name,
    challengerPersona: fight.config.challengerPersona ?? 'ic',
    challengerRole,
    opponentName: fight.opponent?.name ?? null,
    opponentPersona: fight.config.opponentPersona ?? 'ic',
  });
}
