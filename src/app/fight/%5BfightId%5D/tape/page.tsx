"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TapeData } from '@/types';
import { getPusherClient } from '@/lib/pusher';

export default function TaleOfTheTape({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [tape, setTape] = useState<TapeData | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const loadTape = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/tape`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTape(data);
      }
    };
    loadTape();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`fight-${params.fightId}`);
    
    // We didn't emit 'arena-ready' in the start route, so we'll just listen to 'start-turn' 
    // to know the arena has begun and both are ready.
    channel.bind('start-turn', () => {
      router.push(`/fight/${params.fightId}/arena`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`fight-${params.fightId}`);
    };
  }, [params.fightId, router]);

  const handleEnterArena = async () => {
    setWaiting(true);
    await fetch(`/api/fight/${params.fightId}/start`, { method: 'POST' });
    // Push event 'start-turn' will eventually fire and redirect everyone.
  };

  if (!tape) {
    return (
      <div className="min-h-screen canvas-bg flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-h1-heavy italic uppercase text-tertiary animate-pulse">ANALYZING CALENDARS...</h1>
        <div className="w-64 h-2 bg-surface-container mt-4 overflow-hidden"><div className="h-full bg-primary animate-pulse w-full"></div></div>
      </div>
    );
  }

  const redCard = tape.challengerCard.role === 'MANAGER' ? tape.challengerCard : tape.opponentCard;
  const blueCard = tape.challengerCard.role === 'MANAGER' ? tape.opponentCard : tape.challengerCard;

  return (
    <div className="min-h-[calc(100vh-80px)] canvas-bg p-8 flex flex-col relative max-w-[1600px] mx-auto">
      <div className="caution-tape h-4 w-full mb-8"></div>
      
      <div className="text-center mb-8 bg-black border-y-2 border-outline-variant py-4 shadow-lg">
        <h1 className="font-lexend font-black text-6xl italic text-white uppercase tracking-tighter">TALE OF THE TAPE</h1>
        <p className="font-transcript-mono text-tertiary text-sm mt-2 max-w-3xl mx-auto italic">"{tape.rationale}"</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* RED CORNER */}
        <div className="bg-surface-container border-4 border-primary shadow-[15px_15px_0px_#000] p-8 flex flex-col">
          <div className="bg-primary text-black font-h1-heavy text-4xl italic uppercase text-center py-2 mb-8 skew-x-[-8deg] border-2 border-black">
            THE MANAGER (RED)
          </div>
          <h2 className="font-h1-heavy text-3xl text-white uppercase italic text-center mb-2">{redCard.archetype}</h2>
          <div className="bg-black border-2 border-outline-variant p-4 font-label-caps text-secondary uppercase tracking-widest text-center mb-8">
            RECORD: {redCard.record}
          </div>
          
          <h3 className="text-outline text-xs font-bold mb-4 uppercase tracking-widest">SIGNATURE MOVES</h3>
          <ul className="space-y-2 mb-8">
            {redCard.signatureMoves.map((m, i) => (
              <li key={i} className="font-body-bold text-white text-sm bg-primary-container text-on-primary-container p-2 border-l-4 border-primary uppercase">{m}</li>
            ))}
          </ul>
          
          <h3 className="text-outline text-xs font-bold mb-4 uppercase tracking-widest">RECENT TRAUMA (ACTUAL CALENDAR)</h3>
          <ul className="space-y-2 mt-auto font-transcript-mono text-xs text-slate-400">
            {redCard.calendarEntries.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>

        {/* BLUE CORNER */}
        <div className="bg-surface-container border-4 border-secondary-container shadow-[15px_15px_0px_#000] p-8 flex flex-col">
          <div className="bg-secondary-container text-white font-h1-heavy text-4xl italic uppercase text-center py-2 mb-8 skew-x-[8deg] border-2 border-black">
            THE IC (BLUE)
          </div>
          <h2 className="font-h1-heavy text-3xl text-white uppercase italic text-center mb-2">{blueCard.archetype}</h2>
          <div className="bg-black border-2 border-outline-variant p-4 font-label-caps text-secondary uppercase tracking-widest text-center mb-8">
            RECORD: {blueCard.record}
          </div>
          
          <h3 className="text-outline text-xs font-bold mb-4 uppercase tracking-widest">SIGNATURE MOVES</h3>
          <ul className="space-y-2 mb-8">
            {blueCard.signatureMoves.map((m, i) => (
              <li key={i} className="font-body-bold text-white text-sm bg-secondary-container text-on-secondary-container p-2 border-l-4 border-secondary uppercase">{m}</li>
            ))}
          </ul>
          
          <h3 className="text-outline text-xs font-bold mb-4 uppercase tracking-widest">RECENT TRAUMA (ACTUAL CALENDAR)</h3>
          <ul className="space-y-2 mt-auto font-transcript-mono text-xs text-slate-400">
            {blueCard.calendarEntries.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={handleEnterArena} 
          disabled={waiting}
          className="bg-tertiary text-black font-black text-3xl py-6 px-16 uppercase italic hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,0,0,1)] border-4 border-black skew-x-[-4deg] disabled:opacity-50"
        >
          {waiting ? "WAITING ON OPPONENT..." : "ENTER THE ARENA"}
        </button>
      </div>
    </div>
  );
}
