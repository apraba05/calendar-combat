import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentaryTickerProps {
  commentary: string;
}

export default function CommentaryTicker({ commentary }: CommentaryTickerProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t-4 border-commentator shadow-[0_-10px_40px_rgba(234,179,8,0.2)] z-50">
      <div className="flex items-center">
        <div className="bg-commentator text-black font-black uppercase px-6 py-4 flex-shrink-0 text-lg flex items-center gap-2">
          <span className="animate-pulse w-3 h-3 bg-red-600 rounded-full inline-block"></span>
          LIVE
        </div>
        <div className="flex-1 overflow-hidden relative px-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={commentary}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-white font-mono font-bold text-lg uppercase truncate"
            >
              {commentary || "Waiting for the first move..."}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
