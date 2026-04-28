import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatMessage, PersonalityCard } from '../types';

interface ChatStreamProps {
  messages: CombatMessage[];
  agentA: PersonalityCard;
  agentB: PersonalityCard;
}

export default function ChatStream({ messages, agentA, agentB }: ChatStreamProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          if (msg.role === 'commentator') return null;

          const isA = msg.role === 'agentA';
          const agentName = isA ? agentA.name : agentB.name;
          const bgClass = isA ? 'bg-agentA/20 border-agentA/50' : 'bg-agentB/20 border-agentB/50';
          const textClass = isA ? 'text-red-100' : 'text-blue-100';
          const alignClass = isA ? 'self-start' : 'self-end';

          return (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex flex-col w-[90%] md:w-[70%] ${isA ? 'items-start' : 'items-end'} ${alignClass}`}
            >
              <span className={`text-xs uppercase font-bold mb-1 ${isA ? 'text-agentA' : 'text-agentB'}`}>
                {agentName}
              </span>
              <div className={`p-4 rounded-2xl border backdrop-blur-sm shadow-lg ${bgClass} ${textClass}`}>
                <p className="whitespace-pre-wrap leading-relaxed text-lg">{msg.text}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
