"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerdictData } from '@/types';

export default function Verdict({ params }: { params: { fightId: string } }) {
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchVerdict = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/verdict`);
      if (res.ok) setVerdict(await res.json());
    };
    fetchVerdict();
  }, [params.fightId]);

  if (!verdict) return <div className="min-h-screen canvas-bg flex justify-center items-center"><h1 className="text-4xl text-primary font-lexend uppercase italic animate-pulse">GENERATING VERDICT...</h1></div>;

  return (
    <div className="min-h-screen canvas-bg p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl bg-surface-container border-8 border-outline-variant p-8 shadow-[20px_20px_0px_#000] relative">
        <div className="absolute top-0 left-0 w-full h-8 caution-tape"></div>
        <h1 className="font-lexend font-black text-6xl text-white uppercase italic text-center mt-8 mb-4">DECISION RENDERED</h1>
        
        <div className="bg-black border-2 border-primary p-6 mb-8 text-center">
          <h2 className="font-label-caps text-secondary uppercase tracking-widest mb-2">WINNER</h2>
          <h3 className="font-h1-heavy text-5xl text-tertiary uppercase italic">{verdict.winnerName}</h3>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-container-highest p-4 border border-outline-variant">
            <p className="text-outline text-xs uppercase font-bold mb-2">PERSISTENCE</p>
            <div className="h-4 bg-black"><div className="h-full bg-primary" style={{width: `${verdict.stats.persistence}%`}}></div></div>
          </div>
          <div className="bg-surface-container-highest p-4 border border-outline-variant">
            <p className="text-outline text-xs uppercase font-bold mb-2">PASSIVE AGGRESSION</p>
            <div className="h-4 bg-black"><div className="h-full bg-secondary" style={{width: `${verdict.stats.passiveAggression}%`}}></div></div>
          </div>
          <div className="bg-surface-container-highest p-4 border border-outline-variant">
            <p className="text-outline text-xs uppercase font-bold mb-2">SCHEDULING BRUTALITY</p>
            <div className="h-4 bg-black"><div className="h-full bg-red-600" style={{width: `${verdict.stats.schedulingBrutality}%`}}></div></div>
          </div>
          <div className="bg-surface-container-highest p-4 border border-outline-variant">
            <p className="text-outline text-xs uppercase font-bold mb-2">BCC LETHALITY</p>
            <div className="h-4 bg-black"><div className="h-full bg-tertiary" style={{width: `${verdict.stats.bccLethality}%`}}></div></div>
          </div>
        </div>

        <div className="bg-black p-6 border-l-4 border-tertiary mb-8">
          <p className="font-transcript-mono text-tertiary italic">"{verdict.savageQuote}"</p>
        </div>

        {verdict.meetingDetails.status === 'AGREEMENT REACHED' && (
          <div className="bg-white p-6 shadow-2xl relative">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 p-2 text-white"><span className="material-symbols-outlined">calendar_month</span></div>
              <div>
                <h3 className="font-body-bold text-black text-xl">Proposed Sync</h3>
                <p className="text-slate-500 font-mono">{verdict.meetingDetails.date} • {verdict.meetingDetails.time}</p>
              </div>
            </div>
            <button className="w-full mt-4 bg-blue-600 text-white font-bold py-3 uppercase hover:bg-blue-700 transition-colors">
              ADD TO CALENDAR
            </button>
          </div>
        )}

        <button onClick={() => router.push('/')} className="w-full mt-8 bg-primary text-black font-black text-2xl py-6 uppercase italic skew-x-[-4deg] hover:bg-white shadow-[10px_10px_0px_#000]">
          REMATCH
        </button>
      </div>
    </div>
  );
}
