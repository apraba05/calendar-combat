"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PERSONALITIES } from '@/lib/personalities';
import AgentCard from '@/components/AgentCard';
import ChatStream from '@/components/ChatStream';
import CommentaryTicker from '@/components/CommentaryTicker';
import { CombatMessage } from '@/types';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Arena() {
  const searchParams = useSearchParams();
  const aId = searchParams.get('a');
  const bId = searchParams.get('b');
  
  const agentA = PERSONALITIES.find(p => p.id === aId) || PERSONALITIES[0];
  const agentB = PERSONALITIES.find(p => p.id === bId) || PERSONALITIES[1];

  const [messages, setMessages] = useState<CombatMessage[]>([]);
  const [currentCommentary, setCurrentCommentary] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<'starting' | 'ongoing' | 'finished'>('starting');
  const [verdict, setVerdict] = useState<string | null>(null);
  const [activeStreamer, setActiveStreamer] = useState<'agentA' | 'agentB' | 'commentator' | null>(null);
  const [showBell, setShowBell] = useState(true);

  useEffect(() => {
    // Initial bell ring animation
    const timer = setTimeout(() => {
      setShowBell(false);
      setMatchStatus('ongoing');
      startCombat();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const startCombat = async () => {
    try {
      const res = await fetch('/api/combat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentA: agentA.id, agentB: agentB.id })
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
                setActiveStreamer(data.role);
                currentMsgId = data.id;
                msgBuffer = '';
                if (data.role !== 'commentator') {
                  setMessages(prev => [...prev, { id: currentMsgId, role: data.role, text: '' }]);
                }
              } else if (data.type === 'chunk') {
                msgBuffer += data.text;
                if (data.role === 'commentator') {
                  setCurrentCommentary(msgBuffer);
                } else {
                  setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, text: msgBuffer } : m));
                }
              } else if (data.type === 'end_turn') {
                setActiveStreamer(null);
              } else if (data.type === 'verdict') {
                setMatchStatus('finished');
                setVerdict(data.summary);
                setShowBell(true); // Ring bell at end
                setTimeout(() => setShowBell(false), 3000);
              }
            } catch (e) {
              // Ignore parse errors from chunk fragmentation
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 overflow-hidden relative">
      <AnimatePresence>
        {showBell && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="text-center animate-ring-shake">
              <Bell className="w-32 h-32 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-6xl font-black text-yellow-400 uppercase italic tracking-widest drop-shadow-lg">
                DING DING DING
              </h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Matchup */}
      <div className="flex justify-between items-start p-4 bg-slate-950/80 border-b border-slate-800 z-10 gap-4 shadow-xl">
        <div className="w-[40%] max-w-sm">
          <AgentCard agent={agentA} colorClass="border-agentA" isStreaming={activeStreamer === 'agentA'} />
        </div>
        <div className="w-[20%] text-center pt-8">
          <div className="text-4xl font-black italic text-slate-600 drop-shadow-md">VS</div>
          {matchStatus === 'finished' && (
             <div className="mt-4 px-4 py-2 bg-red-600 font-bold uppercase rounded text-white animate-pulse shadow-lg shadow-red-600/50">
               MATCH OVER
             </div>
          )}
        </div>
        <div className="w-[40%] max-w-sm">
          <AgentCard agent={agentB} colorClass="border-agentB" isStreaming={activeStreamer === 'agentB'} />
        </div>
      </div>

      {/* Chat Arena */}
      <div className="flex-1 flex flex-col justify-end bg-[url('/bg-pattern.svg')] bg-repeat opacity-95">
        <ChatStream messages={messages} agentA={agentA} agentB={agentB} />
      </div>

      {/* Ticker */}
      <CommentaryTicker commentary={currentCommentary} />

      {/* Verdict Overlay */}
      <AnimatePresence>
        {matchStatus === 'finished' && verdict && !showBell && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="max-w-2xl text-center space-y-8 p-12 bg-slate-900 border-4 border-yellow-500 rounded-3xl shadow-2xl">
              <h2 className="text-5xl font-black text-yellow-400 uppercase italic drop-shadow-lg">FATALITY / VERDICT</h2>
              <p className="text-2xl text-white whitespace-pre-wrap leading-relaxed">{verdict}</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-wider rounded-full hover:bg-slate-200 transition scale-110 hover:scale-125 duration-200 shadow-xl"
              >
                New Match
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
