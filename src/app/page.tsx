"use client";
import { useRouter } from 'next/navigation';
import { FIGHTERS } from '@/lib/fighters';

export default function Home() {
  const router = useRouter();

  const handleMatchup = (aId: string, bId: string) => {
    const matchupId = Math.random().toString(36).substring(2, 15);
    router.push(`/arena/${matchupId}?a=${aId}&b=${bId}`);
  };

  const matchups = [
    { a: FIGHTERS[0], b: FIGHTERS[1], title: "MAIN EVENT: PRODUCTIVITY PROTOCOL vs. MENTAL STABILITY" },
    { a: FIGHTERS[2], b: FIGHTERS[3], title: "CO-MAIN EVENT: THE SYNERGY PARADOX" },
    { a: FIGHTERS[4], b: FIGHTERS[5], title: "UNDERCARD: THE BIOLOGICAL NEED" }
  ];

  const handleRandom = () => {
    const shuffled = [...FIGHTERS].sort(() => 0.5 - Math.random());
    handleMatchup(shuffled[0].id, shuffled[1].id);
  };

  return (
    <div className="w-full flex flex-col items-center max-w-7xl mx-auto p-8 gap-8">
      {/* Caution tape divider */}
      <div className="caution-tape h-4 w-full"></div>
      
      <div className="text-center mb-8">
        <h1 className="font-lexend font-black text-6xl md:text-8xl italic text-primary tracking-tighter drop-shadow-[0_4px_0px_rgba(104,0,14,1)] mb-2">
          TONIGHT'S CARD
        </h1>
        <p className="font-label-caps text-tertiary uppercase tracking-[0.2em] font-bold text-sm">
          MAIN EVENT: PRODUCTIVITY PROTOCOL vs. MENTAL STABILITY
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {matchups.map((m, idx) => (
          <div key={idx} className="bg-surface-container border-2 border-outline-variant flex flex-col">
            <div className="flex relative h-64 overflow-hidden">
              <div className="flex-1 relative group cursor-pointer" onClick={() => handleMatchup(m.a.id, m.b.id)}>
                <img src={m.a.avatarUrl} alt={m.a.name} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 z-20">
                  <h3 className="font-h2-stadium text-white italic uppercase text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{m.a.name}</h3>
                  <p className="font-label-caps text-primary text-xs tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{m.a.fightRecord}</p>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-tertiary flex items-center justify-center font-h3-bout text-black font-black italic shadow-[3px_3px_0px_#000] z-30">
                VS
              </div>
              <div className="flex-1 relative group cursor-pointer" onClick={() => handleMatchup(m.a.id, m.b.id)}>
                <img src={m.b.avatarUrl} alt={m.b.name} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-4 right-4 text-right z-20">
                  <h3 className="font-h2-stadium text-white italic uppercase text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{m.b.name}</h3>
                  <p className="font-label-caps text-secondary text-xs tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{m.b.fightRecord}</p>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center bg-black border-t-2 border-outline-variant">
              <span className="font-label-caps text-tertiary text-xs tracking-widest uppercase">{m.a.boutName}</span>
              <button onClick={() => handleMatchup(m.a.id, m.b.id)} className="bg-surface-variant text-white px-6 py-2 font-body-bold text-sm hover:bg-white hover:text-black transition-colors uppercase">BET NOW</button>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-black border-y-2 border-primary my-4 py-2 overflow-hidden whitespace-nowrap relative">
        <div className="animate-marquee inline-block font-label-caps text-xs text-white tracking-[0.2em] relative">
          <span className="text-primary mx-4">●</span> MEETINGS RESCHEDULED TONIGHT: 1,247
          <span className="text-primary mx-4">●</span> AVG COFFEE INTAKE: 4.8 CUPS
          <span className="text-primary mx-4">●</span> CURRENT HEART RATE (ENG): 112 BPM
          <span className="text-primary mx-4">●</span> UNREAD EMAILS: 4.2M
        </div>
      </div>

      <button onClick={handleRandom} className="bg-primary hover:bg-tertiary text-on-primary hover:text-black font-h2-stadium italic uppercase tracking-widest py-6 px-12 text-2xl transition-colors shadow-[10px_10px_0px_rgba(0,0,0,1)] border-2 border-black">
        RANDOM MATCHUP
      </button>
      <p className="font-body-main text-xs text-outline mt-2 italic text-center max-w-md">
        WARNING: Entering the arena may result in severe productivity spikes or immediate burnout. Fight responsibly.
      </p>
    </div>
  );
}
