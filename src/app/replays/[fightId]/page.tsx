import { getHistoryStore } from '@/lib/historyStore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ReplayDetailPage({ params }: { params: { fightId: string } }) {
  const history = getHistoryStore();
  const fight = history.find(f => f.id === params.fightId);

  if (!fight) {
    return (
      <div className="p-8 w-full max-w-4xl mx-auto text-center mt-20">
        <h1 className="text-4xl font-black text-primary font-lexend italic uppercase">FIGHT NOT FOUND</h1>
        <Link href="/replays" className="text-white underline mt-4 inline-block">BACK TO REPLAYS</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] relative border-x-4 border-b-4 border-red-900/30">
      
      {/* Header */}
      <div className="bg-surface-container border-b-4 border-red-900/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 shadow-md z-10">
        <div className="flex flex-col items-center">
          <img src={fight.challenger.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=manager'} className="w-16 h-16 rounded-full border-4 border-red-600 bg-black" />
          <span className="font-lexend font-bold text-sm mt-2 text-white">{fight.challenger.name}</span>
          <span className="text-[10px] text-red-500 font-label-caps tracking-widest uppercase">Challenger</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="bg-red-600 text-white text-[10px] px-3 py-1 font-black italic uppercase tracking-widest mb-2 skew-x-[-10deg]">
            PPV REPLAY
          </div>
          <h3 className="text-2xl font-lexend font-black text-white uppercase italic drop-shadow-[0_2px_0px_rgba(255,0,0,0.5)]">
            {fight.config.subject}
          </h3>
          <p className="text-amber-400 font-lexend font-black uppercase tracking-widest mt-1 text-sm">
            WINNER: {fight.verdictData?.winnerName}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <img src={fight.opponent?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ic'} className="w-16 h-16 rounded-full border-4 border-blue-500 bg-black" />
          <span className="font-lexend font-bold text-sm mt-2 text-white">{fight.opponent?.name}</span>
          <span className="text-[10px] text-blue-500 font-label-caps tracking-widest uppercase">Opponent</span>
        </div>
      </div>

      {/* Chat Transcript */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#0a0a0f]">
        {fight.transcript.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[85%] ${
              msg.role === 'MANAGER' ? 'self-start items-start' : 
              msg.role === 'IC' ? 'self-end items-end' : 
              'self-center items-center w-full max-w-[95%]'
            }`}
          >
            {msg.role === 'COMMENTATOR' ? (
              <div className="w-full bg-surface-container-highest border-l-4 border-amber-400 p-4 my-4 flex gap-4 shadow-lg">
                <span className="material-symbols-outlined text-amber-400 text-3xl">campaign</span>
                <div>
                  <div className="font-lexend font-black text-amber-400 text-xs italic tracking-widest mb-1">COMMENTATOR</div>
                  <div className="font-lexend font-bold text-white text-sm uppercase">{msg.text}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-lexend font-black text-[10px] uppercase tracking-widest ${msg.role === 'MANAGER' ? 'text-red-500' : 'text-blue-500'}`}>
                    {msg.role === 'MANAGER' ? fight.challenger.name : fight.opponent?.name}
                  </span>
                  <span className="text-[10px] text-outline-variant">{msg.timestamp}</span>
                </div>
                <div className={`p-4 font-body-main text-white shadow-md relative ${
                  msg.role === 'MANAGER' ? 'bg-red-900/30 border-l-4 border-red-600 rounded-tr-xl rounded-br-xl rounded-bl-xl' : 
                  'bg-blue-900/30 border-r-4 border-blue-600 rounded-tl-xl rounded-bl-xl rounded-br-xl text-right'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                {msg.subtext && (
                  <div className="mt-1 font-lexend text-[10px] text-outline-variant italic">
                    {msg.subtext}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Final Verdict Banner inside Transcript */}
        {fight.verdictData && (
          <div className="w-full bg-red-600 p-6 my-8 shadow-[0_10px_30px_-15px_rgba(255,0,0,1)] text-center skew-y-[-2deg] border-y-4 border-black">
            <h2 className="font-lexend font-black text-black text-4xl italic uppercase">
              {fight.verdictData.meetingDetails.status}
            </h2>
            <p className="font-lexend font-bold text-white mt-2">
              {fight.verdictData.savageQuote}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
