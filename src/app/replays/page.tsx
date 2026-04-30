import { getHistoryStore } from '@/lib/historyStore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ReplaysPage() {
  const history = getHistoryStore();

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      <h1 className="font-lexend font-black text-5xl md:text-7xl italic text-primary tracking-tighter drop-shadow-[0_4px_0px_rgba(104,0,14,1)] uppercase">
        PPV REPLAYS
      </h1>
      <p className="text-xl font-body-main text-outline-variant">
        Rewatch the most brutal calendar negotiations in company history.
      </p>

      {history.length === 0 ? (
        <div className="bg-surface-container border-2 border-outline-variant p-12 text-center text-outline-variant italic font-lexend text-xl">
          NO FIGHTS RECORDED YET. THE ARENA WAITS.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {history.map((fight) => (
            <Link key={fight.id} href={`/replays/${fight.id}`}>
              <div className="bg-surface-container border-4 border-red-900/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-red-600 transition-colors shadow-[5px_5px_0px_#000] cursor-pointer group">
                
                <div className="flex items-center gap-6 w-full md:w-auto">
                  {/* Challenger */}
                  <div className="flex flex-col items-center">
                    <img src={fight.challenger.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=manager'} className="w-16 h-16 rounded-full border-2 border-red-500 bg-black" />
                    <span className="font-lexend font-bold text-sm mt-2 text-white">{fight.challenger.name}</span>
                  </div>
                  
                  <span className="font-lexend font-black text-red-600 italic text-2xl">VS</span>
                  
                  {/* Opponent */}
                  <div className="flex flex-col items-center">
                    <img src={fight.opponent?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ic'} className="w-16 h-16 rounded-full border-2 border-blue-500 bg-black" />
                    <span className="font-lexend font-bold text-sm mt-2 text-white">{fight.opponent?.name || 'Opponent'}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center md:items-start border-l-2 border-red-900/20 pl-6 w-full">
                  <h3 className="text-2xl font-lexend font-black text-white uppercase italic">{fight.config.subject}</h3>
                  <p className="text-outline font-label-caps tracking-widest">{fight.verdictData?.meetingDetails?.status}</p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] text-red-500 font-label-caps uppercase tracking-widest mb-1">WINNER</span>
                  <span className="text-xl font-lexend font-black text-amber-400 italic uppercase">
                    {fight.verdictData?.winnerName || 'DRAW'}
                  </span>
                  <div className="mt-4 bg-primary text-black font-black uppercase italic text-xs px-4 py-2 skew-x-[-10deg] group-hover:bg-white transition-colors">
                    WATCH REPLAY
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
