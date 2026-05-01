"use client";
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';
import { ChatMessage, TapeData } from '@/types';

export default function WatchArena({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [commentaryLines, setCommentaryLines] = useState<{timestamp: string; main: string; sub: string; role: string}[]>([]);
  const [tape, setTape] = useState<TapeData | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTape = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/tape`, { method: 'POST' });
      if (res.ok) setTape(await res.json());
    };
    fetchTape();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`fight-${params.fightId}`);
    
    let currentMsgId = '';
    let msgBuffer = '';

    channel.bind('start-turn', (data: any) => {
      currentMsgId = data.id;
      msgBuffer = '';
      if (data.role !== 'COMMENTATOR') {
        setMessages(prev => [...prev, { id: currentMsgId, role: data.role, text: '', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) }]);
      }
    });

    channel.bind('chunk', (data: any) => {
      msgBuffer += data.text;
      if (data.role !== 'COMMENTATOR') {
        setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, text: msgBuffer } : m));
      }
    });

    channel.bind('end-turn', (data: any) => {
      if (data.role === 'COMMENTATOR') {
        const parts = msgBuffer.split('\n');
        setCommentaryLines(prev => [{
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
          main: parts[0] || '',
          sub: parts[1] || '',
          role: 'COMMENTATOR'
        }, ...prev]);
      }
    });

    channel.bind('verdict-ready', () => {
      setTimeout(() => router.push(`/replays/${params.fightId}`), 2000);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`fight-${params.fightId}`);
    };
  }, [params.fightId, router]);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (!tape) return <div className="min-h-screen canvas-bg flex items-center justify-center"><h1 className="text-white text-4xl font-lexend font-black italic uppercase animate-pulse">CONNECTING TO SATELLITE...</h1></div>;

  const redCard = tape.challengerCard.role === 'MANAGER' ? tape.challengerCard : tape.opponentCard;
  const blueCard = tape.challengerCard.role === 'MANAGER' ? tape.opponentCard : tape.challengerCard;

  return (
    <div className="grid grid-cols-12 gap-8 w-full max-w-[1600px] mx-auto p-8 relative min-h-screen">
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-8">
        
        <div className="flex flex-col items-center justify-center gap-2 relative">
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 font-black text-[10px] tracking-widest uppercase rounded-full animate-pulse">
            LIVE SPECTATOR
          </div>
          <div className="caution-strip h-4 w-full max-w-md shadow-lg shadow-yellow-500/10"></div>
          <div className="flex items-center gap-6">
             <h2 className="font-h1-heavy text-white uppercase italic text-3xl animate-pulse">FIGHT IN PROGRESS</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 relative">
          <div className="md:col-span-3 bg-surface-container border-4 border-primary p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-primary text-on-primary font-black px-4 py-1 skew-x-[-12deg] mr-[-10px] mt-2 z-10">THE MANAGER (RED)</div>
            <h3 className="font-h1-heavy text-3xl text-white uppercase italic mt-4">{redCard.archetype}</h3>
          </div>

          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-black border-4 border-tertiary flex items-center justify-center vs-glow z-10 my-4">
              <span className="font-h1-heavy text-tertiary italic">VS</span>
            </div>
          </div>

          <div className="md:col-span-3 bg-surface-container border-4 border-secondary-container p-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 bg-secondary-container text-white font-black px-4 py-1 skew-x-[12deg] ml-[-10px] mt-2 z-10">THE IC (BLUE)</div>
            <h3 className="font-h1-heavy text-3xl text-white uppercase italic mt-4 text-right">{blueCard.archetype}</h3>
          </div>
        </div>

        <div className="bg-surface-container-low border-2 border-outline-variant flex flex-col h-[500px] relative">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => {
              const isA = msg.role === 'MANAGER';
              return (
                <div key={msg.id} className={`flex flex-col ${isA ? 'items-start' : 'items-end ml-auto'} max-w-[80%]`}>
                  <span className={`font-label-caps text-[10px] mb-1 uppercase ${isA ? 'text-primary' : 'text-secondary'}`}>
                    {msg.role} [{msg.timestamp}]
                  </span>
                  <div className={`p-4 font-body-bold text-body-main relative ${isA ? 'bg-primary-container text-on-primary-container border-l-4 border-primary' : 'bg-secondary-container text-on-secondary-container border-r-4 border-secondary text-right'}`}>
                    {msg.text.replace(/\[.*\]/g, '')}
                    {msg.text.includes('[WALKAWAY]') && <div className="mt-2 text-[10px] font-black uppercase text-white bg-black px-2 py-1 block w-max ml-auto">WALKED AWAY</div>}
                    {msg.text.includes('[AGREEMENT:') && <div className="mt-2 text-[10px] font-black uppercase text-black bg-tertiary px-2 py-1 block w-max">AGREEMENT REACHED</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full">
        <div className="bg-black border-2 border-red-900/30 flex-1 flex flex-col min-h-[500px]">
          <div className="bg-primary text-on-primary p-3 font-h1-heavy italic uppercase tracking-widest text-center shadow-lg">
            PLAY-BY-PLAY
          </div>
          <div className="flex-1 overflow-y-auto relative bg-gradient-to-b from-black via-transparent to-black">
            <div className="p-4 space-y-8 font-transcript-mono text-sm">
              {commentaryLines.map((c, i) => (
                <div key={i} className={`border-l-2 pl-3 ${i === 0 ? 'border-tertiary opacity-100' : 'border-secondary opacity-50'}`}>
                  <span className={`${i === 0 ? 'text-tertiary' : 'text-secondary'} block mb-1 text-[10px]`}>{c.timestamp}</span>
                  <p className="text-white uppercase font-bold">{c.main}</p>
                  {c.sub && <p className="text-outline text-xs mt-1">{c.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
