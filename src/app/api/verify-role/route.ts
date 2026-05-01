import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ROLE_CODES: Record<string, string> = {
  director: 'DIRECTOR2024',
  executive: 'EXEC2024',
};

export async function POST(req: NextRequest) {
  const { persona, code } = await req.json();
  const expected = ROLE_CODES[persona];
  if (!expected) return NextResponse.json({ valid: true }); // No code needed for non-privileged roles
  const valid = code?.trim().toUpperCase() === expected.toUpperCase();
  return NextResponse.json({ valid });
}
