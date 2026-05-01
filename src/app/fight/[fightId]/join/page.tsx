"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PERSONA_OPTIONS = [
  { value: 'intern', icon: '🎓', label: 'INTERN', desc: 'Just got here. What even is a calendar?', privileged: false },
  { value: 'swe', icon: '💻', label: 'SOFTWARE ENGINEER', desc: 'Individual contributor. Protecting deep work time.', privileged: false },
  { value: 'team_lead', icon: '👥', label: 'TEAM LEAD', desc: 'Manage a small team. Calendar is a puzzle.', privileged: false },
  { value: 'director', icon: '🏢', label: 'DIRECTOR', desc: 'Multiple teams. My time is expensive.', privileged: true },
  { value: 'executive', icon: '🎯', label: 'EXECUTIVE', desc: 'C-Suite / VP. Extremely limited availability.', privileged: true },
];

export default function JoinFight({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stance, setStance] = useState<'accept' | 'avoid'>('accept');
  const [persona, setPersona] = useState('swe');
  const [roleCode, setRoleCode] = useState('');
  const [roleCodeError, setRoleCodeError] = useState('');
  const [roleVerified, setRoleVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const selectedPersona = PERSONA_OPTIONS.find(p => p.value === persona);
  const canJoin = !selectedPersona?.privileged || roleVerified;

  const handlePersonaChange = (val: string) => {
    setPersona(val); setRoleCode(''); setRoleCodeError(''); setRoleVerified(false);
  };

  const handleVerifyCode = async () => {
    setVerifying(true); setRoleCodeError('');
    const res = await fetch('/api/verify-role', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, code: roleCode }),
    });
    const { valid } = await res.json();
    if (valid) setRoleVerified(true);
    else setRoleCodeError('Invalid code. Contact your org admin.');
    setVerifying(false);
  };

  const handleAuth = () => {
    setLoading(true);
    window.location.href = `/api/auth/google?action=join&fightId=${params.fightId}`;
  };

  // Try to auto-join if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/join`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ stance, opponentPersona: persona }) });
      if (res.ok) {
        router.push(`/fight/${params.fightId}/tape`);
      } else if (res.status === 401) {
        setNeedsAuth(true); // Show the connect button
      } else {
        setError('Fight not found or already started.');
      }
    };
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  const handleJoin = async () => {
    if (needsAuth) { handleAuth(); return; }
    setLoading(true);
    const res = await fetch(`/api/fight/${params.fightId}/join`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ stance, opponentPersona: persona }) });
    if (res.ok) {
      router.push(`/fight/${params.fightId}/tape`);
    } else if (res.status === 401) {
      handleAuth();
    } else {
      setError('Fight not found or already started.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8">
      <div className="bg-surface-container border-4 border-secondary-container p-12 max-w-2xl w-full shadow-[10px_10px_0px_#000]">
        <h1 className="font-lexend font-black text-4xl italic text-white uppercase mb-2">CHALLENGE RECEIVED</h1>
        <p className="text-outline font-body-main mb-8">You've been challenged to a scheduling bout. Configure your bot, then connect your calendar to enter the ring.</p>

        {error ? (
          <p className="text-red-500 font-bold mb-4 bg-red-900/20 p-4 border border-red-500">{error}</p>
        ) : (
          <>
            {/* Bot Persona Selection */}
            <div className="mb-6">
              <label className="font-label-caps text-secondary text-xs uppercase mb-4 block tracking-widest">YOUR POSITION</label>
              <div className="grid grid-cols-1 gap-2">
                {PERSONA_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handlePersonaChange(opt.value)}
                    className={`border-2 p-3 flex items-center gap-3 text-left transition-all w-full ${
                      persona === opt.value ? 'border-primary bg-primary/10' : 'border-outline-variant'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-lexend font-black text-xs uppercase ${persona === opt.value ? 'text-primary' : 'text-white'}`}>{opt.label}</span>
                        {opt.privileged && <span className="text-[9px] border border-amber-500 text-amber-500 px-1 py-0.5 font-bold uppercase">VERIFIED</span>}
                      </div>
                      <p className="text-[10px] text-outline-variant">{opt.desc}</p>
                    </div>
                    {persona === opt.value && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                  </button>
                ))}
              </div>

              {selectedPersona?.privileged && !roleVerified && (
                <div className="mt-3 bg-amber-900/20 border-2 border-amber-500 p-4">
                  <p className="text-amber-400 font-label-caps text-xs mb-3">🔐 {selectedPersona.label} ROLE REQUIRES VERIFICATION</p>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={roleCode}
                      onChange={e => { setRoleCode(e.target.value); setRoleCodeError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                      placeholder="Enter role access code"
                      className="flex-1 bg-black border-2 border-amber-500/50 p-3 text-white focus:border-amber-400 focus:outline-none"
                    />
                    <button onClick={handleVerifyCode} disabled={!roleCode || verifying} className="bg-amber-500 text-black font-black px-4 uppercase hover:bg-amber-400 disabled:opacity-50">
                      {verifying ? '...' : 'VERIFY'}
                    </button>
                  </div>
                  {roleCodeError && <p className="text-red-400 text-xs mt-2 font-bold">{roleCodeError}</p>}
                </div>
              )}
              {selectedPersona?.privileged && roleVerified && (
                <div className="mt-2 flex items-center gap-2 text-green-400 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">verified</span> {selectedPersona.label} role verified
                </div>
              )}
            </div>

            {/* Bot Stance Selection */}
            <div className="mb-8">
              <label className="font-label-caps text-secondary text-xs uppercase mb-4 block tracking-widest">SET YOUR BOT'S NEGOTIATION STANCE</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStance('accept')}
                  className={`p-6 border-4 flex flex-col items-center gap-3 transition-all ${stance === 'accept' ? 'border-green-500 bg-green-900/20' : 'border-outline-variant text-outline-variant'}`}
                >
                  <span className="material-symbols-outlined text-4xl text-green-400">handshake</span>
                  <div className="text-center">
                    <div className="font-lexend font-black text-white uppercase text-lg">ACCEPT MODE</div>
                    <div className="text-[11px] text-outline-variant mt-1">Your bot is open to the meeting. It will still negotiate hard for a good time, but ultimately wants to find a slot.</div>
                  </div>
                </button>

                <button
                  onClick={() => setStance('avoid')}
                  className={`p-6 border-4 flex flex-col items-center gap-3 transition-all ${stance === 'avoid' ? 'border-red-500 bg-red-900/20' : 'border-outline-variant text-outline-variant'}`}
                >
                  <span className="material-symbols-outlined text-4xl text-red-400">block</span>
                  <div className="text-center">
                    <div className="font-lexend font-black text-white uppercase text-lg">AVOID MODE</div>
                    <div className="text-[11px] text-outline-variant mt-1">Your bot will fight to avoid this meeting at all costs. It will stall, counter-propose far-out dates, and push for WALKAWAY.</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading || !canJoin}
              className={`w-full text-white font-black text-2xl py-6 uppercase italic transition-all shadow-lg disabled:opacity-50 ${stance === 'avoid' ? 'bg-red-700 hover:bg-red-500' : 'bg-secondary-container hover:bg-white hover:text-black'}`}
            >
              {loading ? 'CONNECTING...' : !canJoin ? 'VERIFY YOUR ROLE FIRST' : needsAuth ? 'CONNECT CALENDAR TO ENTER' : `ENTER THE RING (${stance.toUpperCase()} MODE)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
