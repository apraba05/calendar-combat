import { getHistoryStore } from '@/lib/historyStore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface LeaderboardEntry {
  email: string;
  name: string;
  avatar: string;
  wins: number;
  losses: number;
  draws: number;
}

export default function RankingsPage() {
  const history = getHistoryStore();
  
  const stats = new Map<string, LeaderboardEntry>();

  history.forEach(fight => {
    const challenger = fight.challenger;
    const opponent = fight.opponent;
    if (!opponent) return;

    if (!stats.has(challenger.email)) {
      stats.set(challenger.email, { email: challenger.email, name: challenger.name, avatar: challenger.avatar, wins: 0, losses: 0, draws: 0 });
    }
    if (!stats.has(opponent.email)) {
      stats.set(opponent.email, { email: opponent.email, name: opponent.name, avatar: opponent.avatar, wins: 0, losses: 0, draws: 0 });
    }

    const cStats = stats.get(challenger.email)!;
    const oStats = stats.get(opponent.email)!;

    if (fight.verdictData?.winnerRole === 'MANAGER') {
      cStats.wins += 1;
      oStats.losses += 1;
    } else if (fight.verdictData?.winnerRole === 'IC') {
      oStats.wins += 1;
      cStats.losses += 1;
    } else {
      cStats.draws += 1;
      oStats.draws += 1;
    }
  });

  const leaderboard = Array.from(stats.values()).sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      <h1 className="font-lexend font-black text-5xl md:text-7xl italic text-primary tracking-tighter drop-shadow-[0_4px_0px_rgba(104,0,14,1)] uppercase">
        GLOBAL RANKINGS
      </h1>
      <p className="text-xl font-body-main text-outline-variant">
        The most ruthless negotiators in the organization.
      </p>

      {leaderboard.length === 0 ? (
        <div className="bg-surface-container border-2 border-outline-variant p-12 text-center text-outline-variant italic font-lexend text-xl">
          THE RANKINGS ARE EMPTY. ENTER THE ARENA TO CLAIM YOUR SPOT.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[80px_1fr_100px_100px_100px] gap-4 px-6 py-2 text-[10px] font-lexend font-black uppercase tracking-widest text-outline-variant border-b-2 border-outline-variant">
            <div>RANK</div>
            <div>FIGHTER</div>
            <div className="text-center text-green-500">WINS</div>
            <div className="text-center text-red-500">LOSSES</div>
            <div className="text-center text-amber-500">DRAWS</div>
          </div>

          {leaderboard.map((entry, index) => (
            <div key={entry.email} className={`bg-surface-container border-l-4 ${index === 0 ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-red-600'} p-4 flex items-center grid grid-cols-[80px_1fr_100px_100px_100px] gap-4 hover:bg-surface-container-highest transition-colors`}>
              
              <div className={`text-3xl font-lexend font-black italic ${index === 0 ? 'text-amber-400' : 'text-outline-variant'}`}>
                #{index + 1}
              </div>

              <div className="flex items-center gap-4">
                <img src={entry.avatar || 'https://api.dicebear.com/7.x/bottts/svg'} className="w-12 h-12 rounded-full border-2 border-outline-variant bg-black" />
                <div className="flex flex-col">
                  <span className="font-lexend font-bold text-white uppercase">{entry.name}</span>
                  <span className="text-[10px] text-outline font-label-caps">{entry.email}</span>
                </div>
                {index === 0 && <span className="material-symbols-outlined text-amber-400 ml-2">social_leaderboard</span>}
              </div>

              <div className="text-center font-lexend font-black text-2xl text-white">{entry.wins}</div>
              <div className="text-center font-lexend font-black text-2xl text-outline-variant">{entry.losses}</div>
              <div className="text-center font-lexend font-black text-2xl text-outline-variant">{entry.draws}</div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
