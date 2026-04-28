"use client";
import { useEffect, useState } from 'react';
import { FIGHTERS } from '@/lib/fighters';
import { VerdictData } from '@/types';
import { useRouter } from 'next/navigation';

export default function Verdict({ params }: { params: { fightId: string } }) {
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchVerdict = async () => {
      try {
        const res = await fetch('/api/verdict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fightId: params.fightId })
        });
        if (res.ok) {
          const data = await res.json();
          setVerdict(data);
        } else {
          console.error("Failed to fetch verdict");
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVerdict();
  }, [params.fightId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <h1 className="text-4xl font-h1-heavy italic uppercase text-tertiary animate-pulse">Consulting the Judges...</h1>
      </div>
    );
  }

  if (!verdict) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <h1 className="text-4xl font-h1-heavy italic uppercase text-red-500">Verdict Lost in Transmission</h1>
      </div>
    );
  }

  const winnerStr = verdict.winner.toLowerCase();
  const isDraw = winnerStr.includes('draw') || winnerStr.includes('stalemate') || winnerStr.includes('walkaway');
  
  const winnerFighter = FIGHTERS.find(f => winnerStr.includes(f.name.toLowerCase()));
  const avatarUrl = winnerFighter ? winnerFighter.avatarUrl : "https://lh3.googleusercontent.com/aida-public/AB6AXuB_g3VN0WXXp-2eRVAyoNocKLLFjzX9hH_LtCUTYR8JwatoJmqO4gBSvw8Qq-91T7by0WQDqoe8MZD7IDk_Qp1NhyJuPI4ChXvKxT6EUVbIvIuW7rkIJk7Rs0Dx-NsjalnybBtY96YpsD868sYuQ7kuX2qgjSHMFfSyF3IXJTGFv9wwiFP9UDynCxHxo2RMTe0cIPQmqB7So7earUmBZEBRND5iXG0Cv8XDedMRAmIlCcKqyj4Ctz7y6nH_H7favnQRCq2UWPGBSA";

  return (
    <div className="flex-grow canvas-bg p-8 flex flex-col items-center justify-center relative min-h-[calc(100vh-80px)] overflow-hidden">
      <div className="relative w-full max-w-5xl mb-12 mt-12 z-10">
        <div className="caution-tape h-8 w-full mb-4 flex items-center justify-center shadow-lg">
          <span className="bg-black text-tertiary px-4 font-black text-sm tracking-widest italic uppercase">DECISION RENDERED</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          {/* Winner Card */}
          <div className="flex-1 relative">
            <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-30 ${isDraw ? 'bg-slate-400' : 'bg-tertiary'} text-black font-h1-heavy text-h3-bout px-8 py-2 border-4 border-black rotate-[-4deg] shadow-[5px_5px_0px_#000]`}>
              {isDraw ? 'STALEMATE' : 'WINNER'}
            </div>
            <div className={`bg-surface-container-highest border-8 ${isDraw ? 'border-slate-500' : 'border-red-600'} spotlight-glow p-1 h-full relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-2 z-10">
                <span className="material-symbols-outlined text-tertiary text-4xl">stars</span>
              </div>
              <img src={avatarUrl} className="w-full h-80 object-cover grayscale-0 brightness-110" />
              <div className="p-6 bg-black">
                <div className="font-h2-stadium text-h3-bout text-on-surface uppercase mb-1">{isDraw ? 'NO CONTEST' : verdict.winner}</div>
                <div className="font-label-caps text-secondary uppercase tracking-[0.2em]">OUTCOME: {isDraw ? 'WALKAWAY' : 'AGREEMENT'}</div>
              </div>
            </div>
            <div className="absolute -inset-4 pointer-events-none opacity-40 border-4 border-dashed border-tertiary/20"></div>
          </div>

          {/* Final Terms & Scorecard */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-surface-container border-2 border-red-600/30 p-6 flex flex-col">
              <div className="font-label-caps text-tertiary border-b border-tertiary/20 pb-2 mb-4">SAVAGE SCORECARD</div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold">Persistence</div>
                  <div className="h-2 bg-slate-900 mt-1 flex"><div className="h-full bg-red-600 transition-all duration-1000" style={{width: `${verdict.stats.persistence}%`}}></div></div>
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold">Passive Aggression</div>
                  <div className="h-2 bg-slate-900 mt-1 flex"><div className="h-full bg-secondary transition-all duration-1000" style={{width: `${verdict.stats.passiveAggression}%`}}></div></div>
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold">Scheduling Brutality</div>
                  <div className="h-2 bg-slate-900 mt-1 flex"><div className="h-full bg-tertiary transition-all duration-1000" style={{width: `${verdict.stats.schedulingBrutality}%`}}></div></div>
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold">BCC Lethality</div>
                  <div className="h-2 bg-slate-900 mt-1 flex"><div className="h-full bg-red-600 transition-all duration-1000" style={{width: `${verdict.stats.bccLethality}%`}}></div></div>
                </div>
              </div>
              <div className="bg-red-950/40 p-4 border-l-4 border-red-600 italic font-transcript-mono text-sm text-red-200 shadow-inner">
                "{verdict.savageQuote}"
              </div>
            </div>

            <div className="bg-white p-6 shadow-2xl relative overflow-hidden group border border-slate-200">
              <div className="absolute top-0 right-0 caution-tape w-24 h-2 shadow-sm"></div>
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-600 p-2 text-white shadow"><span className="material-symbols-outlined">calendar_month</span></div>
                <div>
                  <h3 className="font-body-bold text-black text-lg">{verdict.meetingDetails.title || 'Untitled Sync'}</h3>
                  <p className="text-slate-500 text-xs font-mono">{verdict.meetingDetails.date} • {verdict.meetingDetails.time}</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="font-bold">LOCATION:</span>
                  <span>{verdict.meetingDetails.location || 'The Ring'}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="font-bold">STATUS:</span>
                  <span className={`${isDraw ? 'text-slate-600' : 'text-red-600'} font-black`}>{verdict.meetingDetails.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4 w-full">
          <button onClick={() => router.push(`/arena/${params.fightId}`)} className="flex-1 bg-surface-container border-4 border-red-600 text-red-600 font-h1-heavy text-h3-bout py-6 uppercase hover:bg-red-600 hover:text-white transition-all group shadow-lg">
            <span className="inline-block group-hover:animate-pulse">REMATCH?</span>
          </button>
          <button onClick={() => router.push('/')} className="flex-1 bg-tertiary border-4 border-black text-black font-h1-heavy text-h3-bout py-6 uppercase hover:shadow-[10px_10px_0px_rgba(255,83,87,1)] transition-all shadow-lg">
            NEW MATCHUP
          </button>
        </div>
      </div>
    </div>
  );
}
