// v2.4 — updated personas, role verification, importance context
"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';

const IMPORTANCE_OPTIONS = [
  { value: 'low', label: 'LOW', desc: 'Nice to have', color: 'border-slate-500 text-slate-400' },
  { value: 'medium', label: 'MEDIUM', desc: 'Should happen', color: 'border-yellow-500 text-yellow-400' },
  { value: 'high', label: 'HIGH', desc: 'Important', color: 'border-orange-500 text-orange-400' },
  { value: 'critical', label: 'CRITICAL', desc: 'Drop everything', color: 'border-red-500 text-red-400' },
];

const DURATION_OPTIONS = [
  { value: '15', label: '15', sublabel: 'Quick sync' },
  { value: '30', label: '30', sublabel: 'Standard' },
  { value: '45', label: '45', sublabel: 'Workshop' },
  { value: '60', label: '60', sublabel: 'Deep dive' },
  { value: '90', label: '90', sublabel: 'Half-day' },
  { value: '120', label: '120', sublabel: 'Full session' },
];

const PERSONA_OPTIONS = [
  { value: 'intern', icon: '🎓', label: 'INTERN', desc: 'Just got here. What even is a calendar?', privileged: false },
  { value: 'swe', icon: '💻', label: 'SOFTWARE ENGINEER', desc: 'Individual contributor. Protecting deep work time.', privileged: false },
  { value: 'team_lead', icon: '👥', label: 'TEAM LEAD', desc: 'Manage a small team. Calendar is a puzzle.', privileged: false },
  { value: 'director', icon: '🏢', label: 'DIRECTOR', desc: 'Multiple teams. Time is expensive.', privileged: true },
  { value: 'executive', icon: '🎯', label: 'EXECUTIVE', desc: 'C-Suite / VP. Extremely limited availability.', privileged: true },
];

export default function NewFight() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('30');
  const [proposedTime, setProposedTime] = useState('');
  const [importance, setImportance] = useState('medium');
  const [persona, setPersona] = useState('swe');
  const [roleCode, setRoleCode] = useState('');
  const [roleCodeError, setRoleCodeError] = useState('');
  const [roleVerified, setRoleVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fightId, setFightId] = useState('');
  const [fightUrl, setFightUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const pusherRef = useRef<any>(null);

  const minDateTime = new Date().toISOString().slice(0, 16);
  const selectedPersona = PERSONA_OPTIONS.find(p => p.value === persona);

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
    const data = await res.json();
    if (data.valid) {
      setRoleVerified(true);
    } else {
      setRoleCodeError('Invalid code. Contact your org admin.');
    }
    setVerifying(false);
  };

  const canSubmit = subject && (!selectedPersona?.privileged || roleVerified);

  const handleAuth = () => {
    window.location.href = '/api/auth/google?action=login';
  };

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/fight/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, durationMinutes: duration, urgency: 'this_week', description: '', proposedTime, importance, challengerPersona: persona })
    });
    if (res.status === 401) { handleAuth(); return; }
    if (res.ok) {
      const { fightId: id } = await res.json();
      setFightId(id);
      setFightUrl(`${window.location.origin}/fight/${id}/join`);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fightUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!fightId) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`fight-${fightId}`);
    channel.bind('opponent-joined', () => {
      router.push(`/fight/${fightId}/tape`);
    });
    pusherRef.current = pusher;
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`fight-${fightId}`);
    };
  }, [fightId, router]);

  if (fightUrl) {
    return (
      <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8">
        <div className="bg-surface-container border-4 border-red-600 p-12 max-w-2xl w-full text-center shadow-[15px_15px_0px_#000]">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse mb-6">notifications_active</span>
          <h2 className="font-h1-heavy text-white text-4xl italic uppercase mb-2">WAITING FOR OPPONENT</h2>
          <p className="text-outline font-body-main mb-8">Send this link. The fight starts the moment they connect their calendar.</p>
          <div className="bg-black p-4 border-2 border-outline-variant flex items-center gap-4 mb-8">
            <code className="text-tertiary flex-1 text-left select-all text-sm break-all">{fightUrl}</code>
            <button onClick={handleCopy} className="bg-surface-variant px-4 py-2 text-white font-bold uppercase hover:bg-white hover:text-black transition-colors shrink-0">
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 text-outline-variant text-sm animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            AUTO-REDIRECTING WHEN OPPONENT JOINS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8">
      <div className="bg-surface-container border-4 border-primary p-12 max-w-2xl w-full shadow-[10px_10px_0px_#000]">
        <h1 className="font-lexend font-black text-4xl italic text-white uppercase mb-8">ISSUE A CHALLENGE</h1>

        <div className="flex flex-col gap-6">
          {/* Meeting Subject */}
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-2 block">MEETING SUBJECT</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold" placeholder="E.g. Q3 Roadmap Sync" />
          </div>

          {/* Proposed Time */}
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-2 block">PROPOSED MEETING TIME</label>
            <input
              type="datetime-local"
              value={proposedTime}
              min={minDateTime}
              onChange={e => setProposedTime(e.target.value)}
              className="w-full bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold"
            />
            <p className="text-[10px] text-outline-variant mt-1 font-label-caps">YOUR BOT OPENS WITH THIS TIME. CALENDAR CONFLICTS ARE DETECTED AUTOMATICALLY.</p>
          </div>

          {/* Bot Persona */}
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-3 block">YOUR POSITION</label>
            <div className="grid grid-cols-1 gap-2">
              {PERSONA_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePersonaChange(opt.value)}
                  className={`border-2 p-4 flex items-center gap-4 text-left transition-all hover:border-white w-full ${
                    persona === opt.value ? 'border-primary bg-primary/10' : 'border-outline-variant'
                  }`}
                >
                  <span className="text-2xl shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-lexend font-black text-sm uppercase ${persona === opt.value ? 'text-primary' : 'text-white'}`}>{opt.label}</span>
                      {opt.privileged && (
                        <span className="text-[10px] border border-amber-500 text-amber-500 px-1.5 py-0.5 font-bold uppercase tracking-wider">VERIFIED ROLE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-outline-variant mt-0.5">{opt.desc}</p>
                  </div>
                  {persona === opt.value && <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>}
                </button>
              ))}
            </div>

            {/* Role verification code for Director/Executive */}
            {selectedPersona?.privileged && !roleVerified && (
              <div className="mt-4 bg-amber-900/20 border-2 border-amber-500 p-4">
                <p className="text-amber-400 font-label-caps text-xs tracking-widest mb-3">
                  🔐 {selectedPersona.label} ROLE REQUIRES VERIFICATION
                </p>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={roleCode}
                    onChange={e => { setRoleCode(e.target.value); setRoleCodeError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                    placeholder="Enter role access code"
                    className="flex-1 bg-black border-2 border-amber-500/50 p-3 text-white focus:border-amber-400 focus:outline-none font-body-bold"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={!roleCode || verifying}
                    className="bg-amber-500 text-black font-black px-4 uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {verifying ? '...' : 'VERIFY'}
                  </button>
                </div>
                {roleCodeError && <p className="text-red-400 text-xs mt-2 font-bold">{roleCodeError}</p>}
              </div>
            )}
            {selectedPersona?.privileged && roleVerified && (
              <div className="mt-3 flex items-center gap-2 text-green-400 text-sm font-bold">
                <span className="material-symbols-outlined text-sm">verified</span>
                {selectedPersona.label} role verified
              </div>
            )}
          </div>

          {/* Meeting Importance */}
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-3 block">MEETING IMPORTANCE</label>
            <div className="grid grid-cols-4 gap-2">
              {IMPORTANCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImportance(opt.value)}
                  className={`border-2 p-3 flex flex-col items-center gap-1 transition-all ${importance === opt.value ? opt.color + ' bg-white/5' : 'border-outline-variant text-outline-variant'}`}
                >
                  <span className="font-lexend font-black text-xs uppercase">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-outline-variant mt-1 font-label-caps">HIGHER = YOUR BOT FIGHTS HARDER. DIRECTORS & EXECS ALWAYS FIGHT AT MAX.</p>
          </div>

          {/* Duration */}
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-3 block">MEETING DURATION</label>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`border-2 p-4 flex flex-col items-center justify-center gap-1 transition-all hover:border-white ${
                    duration === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-outline-variant'
                  }`}
                >
                  <span className="font-lexend font-black text-3xl">{opt.label}</span>
                  <span className="text-[11px] uppercase tracking-wider opacity-70">MIN</span>
                  <span className="text-[10px] opacity-60">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canSubmit || loading}
            className="w-full bg-primary text-black font-black text-2xl py-6 uppercase italic hover:bg-white transition-all shadow-lg mt-4 disabled:opacity-50"
          >
            {loading ? 'INITIALIZING...' : !canSubmit && selectedPersona?.privileged ? 'VERIFY YOUR ROLE FIRST' : 'ISSUE CHALLENGE'}
          </button>
        </div>
      </div>
    </div>
  );
}
