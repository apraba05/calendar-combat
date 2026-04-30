import { cookies } from 'next/headers';
import { getSessionStore } from '@/lib/sessionStore';
import { getHistoryStore } from '@/lib/historyStore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const sessionId = cookies().get('sessionId')?.value;
  const session = sessionId ? getSessionStore().get(sessionId) : null;

  if (!session) {
    return (
      <div className="p-8 w-full max-w-4xl mx-auto text-center mt-20 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-black text-primary font-lexend italic uppercase">NOT LOGGED IN</h1>
        <p className="text-outline-variant font-body-main">You must authenticate to access the Training Camp.</p>
        <a href="/api/auth/google?action=login" className="bg-primary text-black font-black uppercase italic px-8 py-4 hover:bg-white transition-colors skew-x-[-10deg]">
          CONNECT CALENDAR
        </a>
      </div>
    );
  }

  const history = getHistoryStore();
  const userFights = history.filter(f => f.challenger.email === session.email || f.opponent?.email === session.email);
  
  let wins = 0;
  let losses = 0;
  let draws = 0;

  userFights.forEach(fight => {
    const isManager = fight.challenger.email === session.email && fight.verdictData?.winnerRole === 'MANAGER';
    const isIC = fight.opponent?.email === session.email && fight.verdictData?.winnerRole === 'IC';
    
    if (fight.verdictData?.winnerRole === 'DRAW') {
      draws++;
    } else if (isManager || isIC) {
      wins++;
    } else {
      losses++;
    }
  });

  const winRate = userFights.length > 0 ? Math.round((wins / userFights.length) * 100) : 0;

  return (
    <div className="p-8 w-full max-w-5xl mx-auto flex flex-col gap-12">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-container border-l-8 border-primary p-8 shadow-[10px_10px_0px_#000]">
        <img src={session.avatar || 'https://api.dicebear.com/7.x/bottts/svg'} className="w-32 h-32 rounded-full border-4 border-primary bg-black" />
        <div className="flex flex-col flex-1">
          <h1 className="font-lexend font-black text-5xl italic text-white uppercase tracking-tighter">
            {session.name}
          </h1>
          <p className="text-outline-variant font-label-caps tracking-widest">{session.email}</p>
          <div className="mt-4 flex gap-4">
            <span className="bg-red-900/30 text-red-500 border border-red-500 px-4 py-1 font-black text-xs italic uppercase">HEAVYWEIGHT</span>
            <span className="bg-amber-900/30 text-amber-500 border border-amber-500 px-4 py-1 font-black text-xs italic uppercase">ACTIVE ROSTER</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border-2 border-red-900/30 p-6 flex flex-col items-center justify-center text-center">
          <span className="text-outline-variant font-label-caps tracking-widest uppercase mb-2">CAREER WINS</span>
          <span className="text-6xl font-black font-lexend text-white italic">{wins}</span>
        </div>
        <div className="bg-black border-2 border-red-900/30 p-6 flex flex-col items-center justify-center text-center">
          <span className="text-outline-variant font-label-caps tracking-widest uppercase mb-2">WIN PERCENTAGE</span>
          <span className="text-6xl font-black font-lexend text-white italic">{winRate}%</span>
        </div>
        <div className="bg-black border-2 border-red-900/30 p-6 flex flex-col items-center justify-center text-center">
          <span className="text-outline-variant font-label-caps tracking-widest uppercase mb-2">TOTAL FIGHTS</span>
          <span className="text-6xl font-black font-lexend text-white italic">{userFights.length}</span>
        </div>
      </div>

      <div className="bg-surface-container p-8 border-4 border-outline-variant flex flex-col gap-6">
        <h2 className="font-lexend font-black text-3xl text-white italic uppercase border-b-2 border-outline-variant pb-4">FIGHT HISTORY</h2>
        {userFights.length === 0 ? (
          <p className="text-outline-variant italic font-lexend">No fights recorded. Enter the arena.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {userFights.map(fight => {
               const isWin = (fight.challenger.email === session.email && fight.verdictData?.winnerRole === 'MANAGER') || 
                             (fight.opponent?.email === session.email && fight.verdictData?.winnerRole === 'IC');
               const isDraw = fight.verdictData?.winnerRole === 'DRAW';
               const statusColor = isDraw ? 'text-amber-500' : (isWin ? 'text-green-500' : 'text-red-500');
               const statusText = isDraw ? 'DRAW' : (isWin ? 'VICTORY' : 'DEFEAT');

               return (
                 <Link key={fight.id} href={`/replays/${fight.id}`}>
                   <div className="flex justify-between items-center bg-black border border-outline-variant p-4 hover:border-white transition-colors cursor-pointer group">
                     <div className="flex flex-col">
                       <span className="font-lexend font-bold text-white uppercase italic">{fight.config.subject}</span>
                       <span className="text-[10px] text-outline-variant font-label-caps">VS. {fight.challenger.email === session.email ? fight.opponent?.name : fight.challenger.name}</span>
                     </div>
                     <div className={`font-black italic uppercase ${statusColor}`}>
                       {statusText}
                     </div>
                   </div>
                 </Link>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
