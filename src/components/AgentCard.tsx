import { PersonalityCard } from '../types';

interface AgentCardProps {
  agent: PersonalityCard;
  colorClass: string;
  isStreaming?: boolean;
}

export default function AgentCard({ agent, colorClass, isStreaming }: AgentCardProps) {
  return (
    <div className={`p-4 rounded-xl border-2 shadow-lg bg-slate-800 transition-all duration-300 ${colorClass} ${isStreaming ? 'scale-[1.02] ring-4 ring-white/20' : 'opacity-80'}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight">{agent.name}</h2>
        <span className="text-xs uppercase tracking-wider font-bold text-white/80 bg-black/40 px-2 py-1 rounded">
          {agent.archetype}
        </span>
      </div>
      
      <div className="text-sm space-y-2 mt-4 opacity-90 hidden md:block">
        <div className="flex justify-between border-b border-white/10 pb-1">
          <strong className="text-white/60 text-xs uppercase">Meetings/Week</strong>
          <span className="font-mono">{agent.stats.meetingsThisWeek}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-1">
          <strong className="text-white/60 text-xs uppercase">Patience</strong>
          <span className="font-mono">{agent.stats.patienceLevel}</span>
        </div>
        <div className="flex justify-between">
          <strong className="text-white/60 text-xs uppercase">Signature Move</strong>
          <span className="italic text-xs truncate max-w-[120px]" title={agent.stats.powerMove}>{agent.stats.powerMove}</span>
        </div>
      </div>
    </div>
  );
}
