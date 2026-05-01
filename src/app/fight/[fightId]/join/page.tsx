// v3.0 — character-select persona UI, no stance selection, priorities flow
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PERSONAS = [
  {
    value: 'intern',
    icon: '🎓',
    label: 'INTERN',
    flavor: 'The Eager Rookie',
    desc: 'Just got here. What even is a calendar?',
    stats: { aggression: 1, flexibility: 5, authority: 1 },
    privileged: false,
  },
  {
    value: 'swe',
    icon: '💻',
    label: 'SOFTWARE ENGINEER',
    flavor: 'The Deep Work Defender',
    desc: 'IC protecting focus time at all costs.',
    stats: { aggression: 2, flexibility: 4, authority: 2 },
    privileged: false,
  },
  {
    value: 'team_lead',
    icon: '👥',
    label: 'TEAM LEAD',
    flavor: 'The Bridge Builder',
    desc: 'Balancing the team\'s needs with org pressure.',
    stats: { aggression: 3, flexibility: 3, authority: 3 },
    privileged: false,
  },
  {
    value: 'director',
    icon: '🏢',
    label: 'DIRECTOR',
    flavor: 'The Mandate Machine',
    desc: 'Multiple teams. Your time is expensive.',
    stats: { aggression: 4, flexibility: 2, authority: 4 },
    privileged: true,
  },
  {
    value: 'executive',
    icon: '🎯',
    label: 'EXECUTIVE',
    flavor: 'The Calendar Overlord',
    desc: 'C-Suite / VP. Your calendar is mythology.',
    stats: { aggression: 5, flexibility: 1, authority: 5 },
    privileged: true,
  },
];

function StatPips({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2.5 h-2.5 border ${i <= value ? `${color} border-transparent` : 'bg-transparent border-outline-variant/40'}`}
        />
      ))}
    </div>
  );
}

function PersonaCard({
  p,
  selected,
  onSelect,
}: {
  p: typeof PERSONAS[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`border-2 p-4 flex flex-col gap-3 text-left transition-all hover:border-white w-full h-full ${selected ? 'border-secondary-container text-secondary-container bg-white/5' : 'border-outline-variant text-white'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{p.icon}</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {selected && (
            <span className="material-symbols-outlined text-sm text-secondary-container">check_circle</span>
          )}
          {p.privileged && (
            <span className="text-[9px] border border-amber-500 text-amber-500 px-1.5 py-0.5 font-bold uppercase tracking-wider">
              VERIFIED
            </span>
          )}
        </div>
      </div>

      <div>
        <div className={`font-lexend font-black text-sm uppercase ${selected ? 'text-secondary-container' : 'text-white'}`}>
          {p.label}
        </div>
        <div className="text-[11px] text-tertiary font-bold italic mt-0.5">{p.flavor}</div>
        <div className="text-[10px] text-outline-variant mt-1">{p.desc}</div>
      </div>

      <div className="space-y-1.5 mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold text-outline-variant w-16">AGGRESSION</span>
          <StatPips value={p.stats.aggression} color={selected ? 'bg-secondary-container' : 'bg-outline-variant'} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold text-outline-variant w-16">FLEXIBILITY</span>
          <StatPips value={p.stats.flexibility} color={selected ? 'bg-secondary-container' : 'bg-outline-variant'} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold text-outline-variant w-16">AUTHORITY</span>
          <StatPips value={p.stats.authority} color={selected ? 'bg-secondary-container' : 'bg-outline-variant'} />
        </div>
      </div>
    </button>
  );
}

export default function JoinFight({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [persona, setPersona] = useState('swe');
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'IC'>('IC');
  const [roleCode, setRoleCode] = useState('');
  const [roleCodeError, setRoleCodeError] = useState('');
  const [roleVerified, setRoleVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const selectedPersona = PERSONAS.find(p => p.value === persona)!;
  const canJoin = !selectedPersona?.privileged || roleVerified;

  const handlePersonaChange = (val: string) => {
    setPersona(val);
    setRoleCode('');
    setRoleCodeError('');
    setRoleVerified(false);
  };

  const handleVerifyCode = async () => {
    setVerifying(true);
    setRoleCodeError('');
    const res = await fetch('/api/verify-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, code: roleCode }),
    });
    const { valid } = await res.json();
    if (valid) setRoleVerified(true);
    else setRoleCodeError('Invalid code. Contact your org admin.');
    setVerifying(false);
  };

  const handleJoin = async () => {
    if (needsAuth) {
      window.location.href = `/api/auth/google?action=join&fightId=${params.fightId}&persona=${persona}&role=${selectedRole}`;
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/fight/${params.fightId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opponentPersona: persona, opponentSelectedRole: selectedRole }),
    });
    if (res.ok) {
      router.push(`/fight/${params.fightId}/priorities`);
    } else if (res.status === 401) {
      setNeedsAuth(true);
      setLoading(false);
    } else {
      setError('Fight not found or already started.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8">
      <div className="bg-surface-container border-4 border-secondary-container p-10 max-w-3xl w-full shadow-[10px_10px_0px_#000]">
        <h1 className="font-lexend font-black text-4xl italic text-white uppercase mb-2">CHALLENGE RECEIVED</h1>
        <p className="text-outline font-body-main mb-8">
          You've been challenged to a scheduling bout. Pick your fighter, then connect your calendar to enter the ring.
        </p>

        {error ? (
          <p className="text-red-500 font-bold mb-4 bg-red-900/20 p-4 border border-red-500">{error}</p>
        ) : (
          <>
            {/* ── CHARACTER SELECT: Bot Persona ── */}
            <div className="mb-8">
              <label className="font-label-caps text-secondary text-xs uppercase mb-4 block tracking-widest">
                CHOOSE YOUR FIGHTER
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PERSONAS.map(p => (
                  <PersonaCard
                    key={p.value}
                    p={p}
                    selected={persona === p.value}
                    onSelect={() => handlePersonaChange(p.value)}
                  />
                ))}
              </div>

              {selectedPersona?.privileged && !roleVerified && (
                <div className="mt-4 bg-amber-900/20 border-2 border-amber-500 p-4">
                  <p className="text-amber-400 font-label-caps text-xs mb-3">
                    🔐 {selectedPersona.label} ROLE REQUIRES VERIFICATION
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={roleCode}
                      onChange={e => { setRoleCode(e.target.value); setRoleCodeError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                      placeholder="Enter role access code"
                      className="flex-1 bg-black border-2 border-amber-500/50 p-3 text-white focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={handleVerifyCode}
                      disabled={!roleCode || verifying}
                      className="bg-amber-500 text-black font-black px-4 uppercase hover:bg-amber-400 disabled:opacity-50"
                    >
                      {verifying ? '...' : 'VERIFY'}
                    </button>
                  </div>
                  {roleCodeError && <p className="text-red-400 text-xs mt-2 font-bold">{roleCodeError}</p>}
                </div>
              )}
              {selectedPersona?.privileged && roleVerified && (
                <div className="mt-2 flex items-center gap-2 text-green-400 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  {selectedPersona.label} role verified
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="font-label-caps text-secondary text-xs uppercase mb-3 block tracking-widest">
                SELECT YOUR ROLE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('MANAGER')}
                  className={`border-2 p-3 font-black uppercase transition-all ${selectedRole === 'MANAGER' ? 'border-secondary-container bg-secondary-container/10 text-secondary-container' : 'border-outline-variant text-outline-variant'}`}
                >
                  MANAGER
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('IC')}
                  className={`border-2 p-3 font-black uppercase transition-all ${selectedRole === 'IC' ? 'border-secondary-container bg-secondary-container/10 text-secondary-container' : 'border-outline-variant text-outline-variant'}`}
                >
                  IC
                </button>
              </div>
              <p className="text-[10px] text-outline-variant mt-1 font-label-caps">THIS ROLE LOCKS YOUR ARCHETYPE SIDE FOR THE MATCH.</p>
            </div>

            {/* What happens next */}
            <div className="bg-black border-2 border-outline-variant p-4 mb-6">
              <div className="text-[10px] font-bold uppercase text-outline tracking-widest mb-3">WHAT HAPPENS NEXT</div>
              <div className="space-y-2 text-[11px] text-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-black text-white shrink-0">1</span>
                  <span>Connect your Google Calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-black text-white shrink-0">2</span>
                  <span>Set your calendar priorities — what's non-negotiable vs flexible</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-black text-white shrink-0">3</span>
                  <span>Your bot duels it out in the arena using your priorities</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-black text-white shrink-0">4</span>
                  <span>Judge renders a verdict — then you decide whether to accept</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading || !canJoin}
              className="w-full bg-secondary-container text-white font-black text-2xl py-6 uppercase italic hover:bg-white hover:text-black transition-all shadow-lg disabled:opacity-50"
            >
              {loading
                ? 'CONNECTING...'
                : !canJoin
                ? 'VERIFY YOUR ROLE FIRST'
                : needsAuth
                ? 'CONNECT CALENDAR TO ENTER'
                : 'ENTER THE RING'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
