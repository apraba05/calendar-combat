"use client";
import { useRouter } from 'next/navigation';
import { PERSONALITIES } from '../lib/personalities';

export default function MatchupSelector() {
  const router = useRouter();

  const handleMatchup = (aId: string, bId: string) => {
    router.push(`/arena?a=${aId}&b=${bId}`);
  };

  const handleRandom = () => {
    const shuffled = [...PERSONALITIES].sort(() => 0.5 - Math.random());
    handleMatchup(shuffled[0].id, shuffled[1].id);
  };

  const matchups = [
    { title: "The Optimist vs The Wall", a: "p2", b: "p1" },
    { title: "Async vs Quick Sync", a: "p4", b: "p3" },
    { title: "Timezone Wars", a: "p5", b: "p6" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="grid gap-4">
        {matchups.map((m, i) => {
          const agentA = PERSONALITIES.find(p => p.id === m.a);
          const agentB = PERSONALITIES.find(p => p.id === m.b);
          return (
            <button
              key={i}
              onClick={() => handleMatchup(m.a, m.b)}
              className="w-full group relative overflow-hidden rounded-2xl bg-slate-800/80 backdrop-blur border-2 border-slate-700 hover:border-slate-500 transition-all p-6 text-left shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-agentA/10 via-transparent to-agentB/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-agentA">{agentA?.name}</h3>
                  <p className="text-xs text-slate-400">{agentA?.archetype}</p>
                </div>
                <div className="px-4 text-2xl font-black italic text-slate-600">VS</div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-bold text-agentB">{agentB?.name}</h3>
                  <p className="text-xs text-slate-400">{agentB?.archetype}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <button
        onClick={handleRandom}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
      >
        🎲 Random Matchup
      </button>
    </div>
  );
}
