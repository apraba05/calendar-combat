"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PERSONA_OPTIONS = [
  { value: 'ic', icon: '🧑‍💻', label: 'SOLO IC', desc: 'Individual contributor. Protecting my deep work.' },
  { value: 'team_lead', icon: '👥', label: 'TEAM LEAD', desc: 'I manage a small team. Calendar is busy.' },
  { value: 'director', icon: '🏢', label: 'DIRECTOR', desc: 'Multiple teams. My time is expensive.' },
  { value: 'executive', icon: '🎯', label: 'EXECUTIVE', desc: 'C-Suite / VP. Extremely limited availability.' },
];

export default function JoinFight({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stance, setStance] = useState<'accept' | 'avoid'>('accept');
  const [persona, setPersona] = useState('ic');
  const [needsAuth, setNeedsAuth] = useState(false);

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
              <label className="font-label-caps text-secondary text-xs uppercase mb-4 block tracking-widest">YOUR BOT PERSONA (WHO ARE YOU?)</label>
              <div className="grid grid-cols-2 gap-3">
                {PERSONA_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPersona(opt.value)}
                    className={`p-4 border-2 flex flex-col gap-1 text-left transition-all ${
                      persona === opt.value ? 'border-primary bg-primary/10' : 'border-outline-variant'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{opt.icon}</span>
                      <span className={`font-lexend font-black text-sm uppercase ${persona === opt.value ? 'text-primary' : 'text-white'}`}>{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-outline-variant">{opt.desc}</p>
                  </button>
                ))}
              </div>
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
              disabled={loading} 
              className={`w-full text-white font-black text-2xl py-6 uppercase italic transition-all shadow-lg disabled:opacity-50 ${stance === 'avoid' ? 'bg-red-700 hover:bg-red-500' : 'bg-secondary-container hover:bg-white hover:text-black'}`}
            >
              {loading ? 'CONNECTING...' : needsAuth ? 'CONNECT CALENDAR TO ENTER' : `ENTER THE RING (${stance.toUpperCase()} MODE)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
