"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FIGHTERS } from '@/lib/fighters';
import { CombatMessage } from '@/types';

export default function Arena({ params }: { params: { matchupId: string } }) {
  const searchParams = useSearchParams();
  const aId = searchParams.get('a');
  const bId = searchParams.get('b');
  const router = useRouter();
  
  const agentA = FIGHTERS.find(p => p.id === aId) || FIGHTERS[0];
  const agentB = FIGHTERS.find(p => p.id === bId) || FIGHTERS[1];

  const [messages, setMessages] = useState<CombatMessage[]>([]);
  const [commentaryLines, setCommentaryLines] = useState<{timestamp: string; main: string; sub: string; role: string}[]>([]);
  const [matchStatus, setMatchStatus] = useState<'starting' | 'ongoing' | 'finished'>('starting');
  const [exchanges, setExchanges] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const playBell = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 1.5);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
      } catch (e) {}
    };
    
    playBell();
    startCombat();
  }, []);

  const playThud = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
  };

  const startCombat = async () => {
    try {
      const res = await fetch('/api/fight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchupId: params.matchupId, agentA: agentA.id, agentB: agentB.id })
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let currentMsgId = '';
      let msgBuffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              
              if (data.type === 'start_turn') {
                currentMsgId = data.id;
                msgBuffer = '';
                if (data.role !== 'commentator') {
                  setMessages(prev => [...prev, { id: currentMsgId, role: data.role, text: '', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) }]);
                }
              } else if (data.type === 'chunk') {
                msgBuffer += data.text;
                if (data.role !== 'commentator') {
                  setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, text: msgBuffer } : m));
                }
              } else if (data.type === 'end_turn') {
                if (data.role !== 'commentator') {
                  setExchanges(e => e + 0.5);
                  playThud();
                } else {
                  const parts = msgBuffer.split('\n');
                  const main = parts[0] || '';
                  const sub = parts[1] || '';
                  const isChair = msgBuffer.includes('BAH GAWD') || (Math.random() < 0.05 && msgBuffer.includes('WALKAWAY'));
                  const actualMain = isChair ? "BAH GAWD THEY BROUGHT OUT A STEEL CHAIR!" : main;
                  
                  if (actualMain.includes('!')) {
                    document.body.classList.add('animate-ring-shake');
                    setTimeout(() => document.body.classList.remove('animate-ring-shake'), 500);
                  }

                  setCommentaryLines(prev => [{
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
                    main: actualMain,
                    sub,
                    role: 'commentator'
                  }, ...prev]);
                }
              } else if (data.type === 'verdict_ready') {
                setMatchStatus('finished');
                setTimeout(() => {
                  router.push(`/verdict/${params.matchupId}`);
                }, 1000);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-8 w-full max-w-[1600px] mx-auto p-8 relative">
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="caution-strip h-4 w-full max-w-md shadow-lg shadow-yellow-500/10"></div>
          <div className="flex items-center gap-6">
            <div className="bg-surface-container-highest p-4 border-2 border-primary">
              <span className="material-symbols-outlined text-4xl text-tertiary">notifications</span>
            </div>
            <div className="text-center">
              <h2 className="font-h1-heavy text-h3-bout text-white uppercase italic">ROUND {Math.floor(exchanges) + 1}</h2>
              <p className="font-label-caps text-tertiary animate-pulse">
                {matchStatus === 'finished' ? 'DECISION RENDERED' : 'FIGHT IN PROGRESS'}
              </p>
            </div>
            <div className="bg-surface-container-highest p-4 border-2 border-primary">
              <span className="material-symbols-outlined text-4xl text-tertiary">timer</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
          <div className="md:col-span-3 bg-surface-container border-4 border-primary p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-primary text-on-primary font-black px-4 py-1 skew-x-[-12deg] mr-[-10px] mt-2 z-10">RED CORNER</div>
            <div className="flex flex-col gap-4">
              <div className="aspect-square w-full bg-surface-container-low border-2 border-outline-variant overflow-hidden relative">
                <img src={agentA.avatarUrl} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-h1-heavy text-h3-bout text-white uppercase italic truncate">{agentA.name}</h3>
                <p className="font-label-caps text-primary">ARCHETYPE: {agentA.archetype}</p>
              </div>
              <div className="space-y-2 border-t-2 border-primary/30 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-[10px] text-outline uppercase">{agentA.stats.stat1Label}</span>
                  <span className="font-body-bold text-primary uppercase">{agentA.stats.stat1Value}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest"><div className="bg-primary h-full w-[20%]"></div></div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-label-caps text-[10px] text-outline">STYLE</span>
                  <span className="font-body-bold text-white text-xs truncate max-w-[150px] uppercase">{agentA.style.split(',')[0]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <div className="w-[2px] h-24 bg-gradient-to-b from-primary to-secondary-container"></div>
            <div className="w-20 h-20 rounded-full bg-black border-4 border-tertiary flex items-center justify-center vs-glow z-10 my-4">
              <span className="font-h1-heavy text-h3-bout text-tertiary italic">VS</span>
            </div>
            <div className="w-[2px] h-24 bg-gradient-to-t from-secondary-container to-primary"></div>
          </div>

          <div className="md:col-span-3 bg-surface-container border-4 border-secondary-container p-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 bg-secondary-container text-white font-black px-4 py-1 skew-x-[12deg] ml-[-10px] mt-2 z-10">BLUE CORNER</div>
            <div className="flex flex-col gap-4">
              <div className="aspect-square w-full bg-surface-container-low border-2 border-outline-variant overflow-hidden">
                <img src={agentB.avatarUrl} className="w-full h-full object-cover" />
              </div>
              <div className="text-right">
                <h3 className="font-h1-heavy text-h3-bout text-white uppercase italic truncate">{agentB.name}</h3>
                <p className="font-label-caps text-secondary">ARCHETYPE: {agentB.archetype}</p>
              </div>
              <div className="space-y-2 border-t-2 border-secondary-container/30 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-[10px] text-outline text-right w-full pr-2 uppercase">{agentB.stats.stat1Label}</span>
                  <span className="font-body-bold text-secondary uppercase">{agentB.stats.stat1Value}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest"><div className="bg-secondary-container h-full w-[95%] float-right"></div></div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-label-caps text-[10px] text-outline text-right w-full pr-2">STYLE</span>
                  <span className="font-body-bold text-white text-xs truncate max-w-[150px] uppercase">{agentB.style.split(',')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low border-2 border-outline-variant flex flex-col h-[500px] relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => {
              const isA = msg.role === 'agentA';
              const name = isA ? agentA.name : agentB.name;
              const time = msg.timestamp;
              return (
                <div key={i} className={`flex flex-col ${isA ? 'items-start' : 'items-end ml-auto'} max-w-[80%]`}>
                  <span className={`font-label-caps text-[10px] mb-1 uppercase ${isA ? 'text-primary' : 'text-secondary'}`}>
                    {name} [{time}]
                  </span>
                  <div className={`p-4 font-body-bold text-body-main relative ${isA ? 'bg-primary-container text-on-primary-container border-l-4 border-primary' : 'bg-secondary-container text-on-secondary-container border-r-4 border-secondary text-right'}`}>
                    {msg.text.replace(/\[AGREEMENT:.*?\]|\[WALKAWAY\]/g, '')}
                    {msg.text.includes('[WALKAWAY]') && <div className="mt-2 text-[10px] font-black uppercase text-white bg-black px-2 py-1 block w-max ml-auto">WALKED AWAY</div>}
                    {msg.text.includes('[AGREEMENT:') && <div className="mt-2 text-[10px] font-black uppercase text-black bg-tertiary px-2 py-1 block w-max">AGREEMENT REACHED</div>}
                    <div className={`absolute -bottom-2 ${isA ? 'left-4 bg-primary-container' : 'right-4 bg-secondary-container'} w-4 h-4 rotate-45`}></div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </div>

        <div className="bg-surface-container p-6 border-2 border-outline-variant">
          <div className="flex justify-between items-end mb-4">
            <h4 className="font-label-caps text-white">EXCHANGES REMAINING</h4>
            <span className="font-h1-heavy text-h3-bout text-tertiary">{(12 - Math.floor(exchanges)).toString().padStart(2, '0')} / 12</span>
          </div>
          <div className="flex flex-col gap-1">
            {[1,2,3].map(i => (
              <div key={i} className="h-[2px] bg-surface-container-highest w-full relative overflow-hidden">
                <div className="absolute h-full bg-tertiary transition-all duration-500" style={{width: `${Math.max(0, 100 - (exchanges/12)*100)}%`}}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full">
        <div className="bg-black border-2 border-red-900/30 flex-1 flex flex-col min-h-[500px]">
          <div className="bg-primary text-on-primary p-3 font-h1-heavy text-body-bold italic uppercase tracking-widest text-center shadow-lg">
            PLAY-BY-PLAY
          </div>
          <div className="flex-1 overflow-y-auto relative bg-gradient-to-b from-black via-transparent to-black">
            <div className="p-4 space-y-8 font-transcript-mono text-sm">
              {commentaryLines.map((c, i) => (
                <div key={i} className={`border-l-2 pl-3 ${i === 0 ? 'border-tertiary opacity-100' : i === 1 ? 'border-primary opacity-80' : 'border-secondary opacity-50'}`}>
                  <span className={`${i === 0 ? 'text-tertiary' : i === 1 ? 'text-primary' : 'text-secondary'} block mb-1 text-[10px]`}>{c.timestamp}</span>
                  <p className="text-white uppercase font-bold">{c.main}</p>
                  {c.sub && <p className="text-outline text-xs mt-1">{c.sub}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-highest p-4 border-t-2 border-red-900/30">
            <button className="w-full border-2 border-tertiary text-tertiary font-black py-2 hover:bg-tertiary hover:text-black transition-all uppercase italic">
              REQUEST MEDIATION
            </button>
          </div>
        </div>

        <div className="bg-surface-container border-2 border-primary p-4 relative shrink-0 shadow-lg">
          <div className="caution-strip h-2 w-full absolute top-0 left-0"></div>
          <h5 className="font-h1-heavy text-label-caps text-white mt-2 uppercase">CHAMPION'S TIP</h5>
          <p className="font-body-main text-xs text-outline mt-2 italic">"Always keep an 8:00 AM 'Ghost Meeting' for leverage." - The Undefeated Admin</p>
        </div>
      </aside>
    </div>
  );
}
