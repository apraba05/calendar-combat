"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';

export default function NewFight() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('30');
  const [urgency, setUrgency] = useState('this_week');
  const [loading, setLoading] = useState(false);
  const [fightUrl, setFightUrl] = useState('');

  const handleAuth = () => {
    window.location.href = '/api/auth/google?action=login';
  };

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/fight/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, durationMinutes: duration, urgency, description: '' })
    });
    
    if (res.status === 401) {
      handleAuth();
      return;
    }

    if (res.ok) {
      const { fightId } = await res.json();
      setFightUrl(`${window.location.origin}/fight/${fightId}/join`);
    }
    setLoading(false);
  };

  if (fightUrl) {
    return (
      <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8">
        <div className="bg-surface-container border-4 border-red-600 p-12 max-w-2xl w-full text-center shadow-[15px_15px_0px_#000]">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse mb-6">notifications_active</span>
          <h2 className="font-h1-heavy text-white text-4xl italic uppercase mb-4">WAITING FOR OPPONENT</h2>
          <p className="text-outline font-body-main mb-8">Send this link to your colleague. The fight begins when they connect their calendar.</p>
          
          <div className="bg-black p-4 border-2 border-outline-variant flex items-center gap-4 mb-8">
            <code className="text-tertiary flex-1 text-left select-all">{fightUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(fightUrl)} className="bg-surface-variant px-4 py-2 text-white font-bold uppercase hover:bg-white hover:text-black transition-colors">Copy</button>
          </div>
          
          <div className="caution-tape h-4 w-full opacity-50"></div>
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
