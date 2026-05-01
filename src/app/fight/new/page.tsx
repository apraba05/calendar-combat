// v2.1 — proposed time, importance, bot stance
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

export default function NewFight() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('30');
  const [urgency, setUrgency] = useState('this_week');
  const [proposedTime, setProposedTime] = useState('');
  const [importance, setImportance] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [fightId, setFightId] = useState('');
  const [fightUrl, setFightUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const pusherRef = useRef<any>(null);

  // Fix: get min datetime for the input (now)
  const minDateTime = new Date().toISOString().slice(0, 16);

  const handleAuth = () => {
    window.location.href = '/api/auth/google?action=login';
  };

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/fight/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, durationMinutes: duration, urgency, description: '', proposedTime, importance })
    });
    
    if (res.status === 401) {
      handleAuth();
      return;
    }

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

  // Fix: Listen for opponent joining and auto-redirect challenger
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
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-2 block">MEETING SUBJECT</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold" placeholder="E.g. Q3 Roadmap Sync" />
          </div>

          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-2 block">PROPOSED MEETING TIME</label>
            <input 
              type="datetime-local" 
              value={proposedTime} 
              min={minDateTime}
              onChange={e => setProposedTime(e.target.value)} 
              className="w-full bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold" 
            />
            <p className="text-[10px] text-outline-variant mt-1 font-label-caps">YOUR BOT WILL OPEN WITH THIS TIME. IF THERE'S A CONFLICT, THE BATTLE BEGINS.</p>
          </div>
          
          <div>
            <label className="font-label-caps text-primary text-xs uppercase mb-3 block">MEETING IMPORTANCE</label>
            <div className="grid grid-cols-4 gap-2">
              {IMPORTANCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setImportance(opt.value)}
                  className={`border-2 p-3 flex flex-col items-center gap-1 transition-all ${importance === opt.value ? opt.color + ' bg-white/5' : 'border-outline-variant text-outline-variant'}`}
                >
                  <span className="font-lexend font-black text-xs uppercase">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-outline-variant mt-1 font-label-caps">HIGHER IMPORTANCE = YOUR BOT FIGHTS HARDER AND REFUSES TO ACCEPT A WALKAWAY.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-primary text-xs uppercase mb-2 block">DURATION (MIN)</label>
              <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold">
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </div>
            <div>
              <label className="font-label-caps text-primary text-xs uppercase mb-2 block">URGENCY</label>
              <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold">
                <option value="this_week">THIS WEEK</option>
                <option value="next_two_weeks">NEXT 14 DAYS</option>
                <option value="flexible">FLEXIBLE</option>
              </select>
            </div>
          </div>
          
          <button onClick={handleCreate} disabled={!subject || loading} className="w-full bg-primary text-black font-black text-2xl py-6 uppercase italic hover:bg-white transition-all shadow-lg mt-4 disabled:opacity-50">
            {loading ? 'INITIALIZING...' : 'ISSUE CHALLENGE'}
          </button>
        </div>
      </div>
    </div>
  );
}
