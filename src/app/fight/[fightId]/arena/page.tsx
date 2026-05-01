"use client";
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';
import { ChatMessage, TapeData } from '@/types';

// ─── Pixel Art Boxer Grids ────────────────────────────────────────────────────
// 12 cols × 16 rows, each char = 5px square.
// H=helmet  S=skin  E=eye  M=mouthguard  N=neck
// G=back-glove  W=shirt  A=guard-arm  F=punch-glove
// R=trunks  L=leg  D=shoe  .=transparent
const IDLE_GRID = [
  '...HHHHHH...',  // 0  helmet top
  '..HHHHHHHH..',  // 1  helmet full
  '..SSSSSSSS..',  // 2  head
  '..SS.EE.SS..',  // 3  eyes
  '..SSSSSSSS..',  // 4  face
  '....MMMM....',  // 5  mouthguard
  '....NNNN....',  // 6  neck
  'GGWWWWWWWWAA',  // 7  shirt + back glove (G) + guard arm (A)
  'G.WWWWWWWW.F',  // 8  gloves at guard height
  'G.WWWWWWWW.F',  // 9
  '..RRRRRRRR..',  // 10 trunks
  '..RRRRRRRR..',  // 11
  '...LL..LL...',  // 12 legs
  '...LL..LL...',  // 13
  '...LL..LL...',  // 14
  '..DDD..DDD..',  // 15 shoes
];

// Punch stance: front glove (F) extended — arm (A) replaced by bigger glove block
const PUNCH_GRID = [
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..SSSSSSSS..',
  '..SS.EE.SS..',
  '..SSSSSSSS..',
  '....MMMM....',
  '....NNNN....',
  'GGWWWWWWWWFF',  // 7  arm fully extended into glove
  'G.WWWWWWWWFF',  // 8  bigger glove block
  'G.WWWWWWWWFF',  // 9
  '..RRRRRRRR..',
  '..RRRRRRRR..',
  '...LL..LL...',
  '...LL..LL...',
  '...LL..LL...',
  '..DDD..DDD..',
];

function PixelBoxer({
  color,
  facing,
  punching,
}: {
  color: 'red' | 'blue';
  facing: 'right' | 'left';
  punching: boolean;
}) {
  const p = 5; // 1 pixel = 5 CSS px
  const primary = color === 'red' ? '#dd1111' : '#0356ff';
  const colorMap: Record<string, string> = {
    H: primary,   S: '#e8c09a', E: '#111130', M: primary,
    N: '#e8c09a', G: primary,   W: '#f0f0f0', A: '#e8c09a',
    F: primary,   R: primary,   L: '#e8c09a', D: '#111130',
  };

  const grid = punching ? PUNCH_GRID : IDLE_GRID;
  // Blue boxer faces left: mirror each row horizontally
  const rows = facing === 'left'
    ? grid.map((r) => r.split('').reverse().join(''))
    : grid;

  const W = p * (grid[0]?.length ?? 12);
  const H = p * rows.length;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {rows.flatMap((row, y) =>
        row.split('').map((char, x) => {
          const fill = colorMap[char];
          if (!fill) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * p}
              y={y * p}
              width={p}
              height={p}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}

interface FightMeta {
  subject: string;
  durationMinutes: number;
  challengerName: string;
  challengerPersona: string;
  challengerRole: 'MANAGER' | 'IC' | null;
  opponentName: string | null;
  opponentPersona: string;
}

const PERSONA_LABEL: Record<string, string> = {
  ic: 'INDIVIDUAL CONTRIBUTOR',
  swe: 'SOFTWARE ENGINEER',
  team_lead: 'TEAM LEAD',
  director: 'DIRECTOR',
  executive: 'EXECUTIVE',
  intern: 'INTERN',
};

export default function Arena({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [commentaryLines, setCommentaryLines] = useState<{timestamp: string; main: string; sub: string; role: string}[]>([]);
  const [tape, setTape] = useState<TapeData | null>(null);
  const [meta, setMeta] = useState<FightMeta | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const isScrolledUpRef = useRef(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'MANAGER' | 'IC' | 'COMMENTATOR' | null>(null);
  const formatTs = (isoOrTime: string) => {
    const d = new Date(isoOrTime);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return isoOrTime;
  };

  useEffect(() => {
    const fetchTape = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/tape`, { method: 'POST' });
      if (res.ok) setTape(await res.json());
    };
    const fetchMeta = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/meta`);
      if (res.ok) setMeta(await res.json());
    };
    fetchTape();
    fetchMeta();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`fight-${params.fightId}`);
    
    let currentMsgId = '';
    let msgBuffer = '';

    channel.bind('start-turn', (data: any) => {
      currentMsgId = data.id;
      msgBuffer = '';
      setCurrentSpeaker(data.role);
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
      setCurrentSpeaker(null);
      if (data.role !== 'COMMENTATOR') {
        setMessages(prev => prev.map(m => m.id === data.id ? { ...m, text: data.text || m.text } : m));
      } else {
        const parts = (msgBuffer || data.text || '').split('\n');
        setCommentaryLines(prev => [{
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
          main: parts[0] || '',
          sub: parts[1] || '',
          role: 'COMMENTATOR'
        }, ...prev]);
      }
    });

    channel.bind('verdict-ready', () => {
      setTimeout(() => router.push(`/fight/${params.fightId}/verdict`), 2000);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`fight-${params.fightId}`);
    };
  }, [params.fightId, router]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/fight/${params.fightId}/state`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'verdict' || data.verdictReady) {
          router.push(`/fight/${params.fightId}/verdict`);
          return;
        }
        const transcript = Array.isArray(data.transcript) ? data.transcript : [];
        const nonCommentary = transcript.filter((m: any) => m.role !== 'COMMENTATOR');
        const commentary = transcript.filter((m: any) => m.role === 'COMMENTATOR');
        // Merge completed transcript entries without overwriting in-progress Pusher messages.
        // Only add messages whose IDs aren't already tracked by Pusher.
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const incoming: ChatMessage[] = nonCommentary.map((m: any) => ({
            id: m.id,
            role: m.role,
            text: m.text,
            timestamp: formatTs(m.timestamp),
          }));
          // Update text for messages we already have (transcript is source of truth for completed turns),
          // and append any that arrived via transcript but were missed by Pusher.
          const updated = prev.map(m => {
            const fromTranscript = incoming.find((t: ChatMessage) => t.id === m.id);
            return fromTranscript ? { ...m, text: fromTranscript.text } : m;
          });
          const missing = incoming.filter((t: ChatMessage) => !existingIds.has(t.id));
          return missing.length ? [...updated, ...missing] : updated;
        });
        setCommentaryLines(prev => {
          const existingIds = new Set(prev.map((_, i) => i)); // commentary has no stable IDs
          const incoming = commentary.map((m: any) => {
            const parts = String(m.text || '').split('\n');
            return {
              timestamp: formatTs(m.timestamp),
              main: parts[0] || '',
              sub: parts[1] || '',
              role: 'COMMENTATOR',
            };
          }).reverse();
          // Only replace if the transcript has more entries than we currently show.
          return incoming.length > prev.length ? incoming : prev;
        });
      } catch {}
    }, 2000);
    return () => clearInterval(poll);
  }, [params.fightId, router]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isScrolledUpRef.current = !nearBottom;
    setIsScrolledUp(!nearBottom);
  };

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const prevHeight = prevScrollHeightRef.current;
    const nextHeight = el.scrollHeight;
    const delta = nextHeight - prevHeight;

    if (isScrolledUpRef.current) {
      // Preserve user viewport while new chunks stream in.
      if (delta > 0) el.scrollTop += delta;
    } else {
      el.scrollTop = nextHeight;
    }

    prevScrollHeightRef.current = nextHeight;
  }, [messages]);

  const jumpToLatest = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      prevScrollHeightRef.current = el.scrollHeight;
    }
    setIsScrolledUp(false);
    isScrolledUpRef.current = false;
  };

  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    const url = `${window.location.origin}/fight/${params.fightId}/arena`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!tape) return <div className="min-h-screen canvas-bg" />;

  const redCard = tape.challengerCard.role === 'MANAGER' ? tape.challengerCard : tape.opponentCard;
  const blueCard = tape.challengerCard.role === 'MANAGER' ? tape.opponentCard : tape.challengerCard;

  // Map real user names/personas to red and blue corners
  const isChallengerManager = tape.challengerCard.role === 'MANAGER';
  const redName  = isChallengerManager ? (meta?.challengerName ?? '') : (meta?.opponentName ?? '');
  const blueName = isChallengerManager ? (meta?.opponentName ?? '') : (meta?.challengerName ?? '');
  const redPersona  = PERSONA_LABEL[isChallengerManager ? (meta?.challengerPersona ?? '') : (meta?.opponentPersona ?? '')] ?? '';
  const bluePersona = PERSONA_LABEL[isChallengerManager ? (meta?.opponentPersona ?? '') : (meta?.challengerPersona ?? '')] ?? '';
  const redHeader = redPersona ? `THE ${redPersona}` : 'RED CORNER';
  const blueHeader = bluePersona ? `THE ${bluePersona}` : 'BLUE CORNER';
  const getSpeakerLabel = (role: ChatMessage['role']) => {
    if (role === 'COMMENTATOR') return 'COMMENTATOR';
    if (role === 'MANAGER') return redPersona || redName || 'RED CORNER';
    return bluePersona || blueName || 'BLUE CORNER';
  };

  return (
    <div className="grid grid-cols-12 gap-8 w-full max-w-[1600px] mx-auto p-8 relative min-h-screen">
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-8">
        
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="caution-strip h-4 w-full max-w-md shadow-lg shadow-yellow-500/10"></div>
          <div className="flex items-center gap-6">
             <h2 className="font-h1-heavy text-white uppercase italic text-3xl animate-pulse">FIGHT IN PROGRESS</h2>
          </div>
        </div>

        {/* ── Pixel Boxing Ring ───────────────────────────────────────── */}
        <div className="relative flex items-end justify-center gap-4 overflow-visible py-3">
          {/* Ambient corner spotlights */}
          <div
            className={`absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-red-900/25 to-transparent pointer-events-none transition-opacity duration-300 ${currentSpeaker === 'MANAGER' ? 'opacity-100' : 'opacity-25'}`}
          />
          <div
            className={`absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-blue-900/25 to-transparent pointer-events-none transition-opacity duration-300 ${currentSpeaker === 'IC' ? 'opacity-100' : 'opacity-25'}`}
          />

          {/* Ring ropes — top */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${currentSpeaker && currentSpeaker !== 'COMMENTATOR' ? 'animate-rope-pulse' : ''}`}
            style={{ background: 'linear-gradient(90deg, #cc1111 0%, #e9c400 50%, #0356ff 100%)', opacity: 0.5 }}
          />
          {/* Ring canvas floor */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-red-600/30 via-yellow-500/40 to-blue-600/30" />

          {/* RED BOXER */}
          <div
            className={
              currentSpeaker === 'MANAGER'
                ? 'animate-boxer-lunge-right'
                : currentSpeaker === 'IC'
                ? 'animate-boxer-reel-left'
                : 'animate-boxer-bob'
            }
          >
            <PixelBoxer color="red" facing="right" punching={currentSpeaker === 'MANAGER'} />
            <div className="text-center mt-1">
              {redName && <div className="font-black text-[11px] uppercase tracking-wider text-white truncate max-w-[60px]">{redName}</div>}
              {redPersona && <div className="font-black text-[9px] uppercase tracking-widest text-red-500">{redPersona}</div>}
            </div>
          </div>

          {/* VS Ring + impact burst */}
          <div className="relative z-20 flex-shrink-0 flex flex-col items-center mx-2">
            <div
              className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-150 ${
                currentSpeaker && currentSpeaker !== 'COMMENTATOR'
                  ? 'border-yellow-400 animate-vs-fight'
                  : 'border-yellow-800/40'
              }`}
              style={{
                boxShadow:
                  currentSpeaker && currentSpeaker !== 'COMMENTATOR'
                    ? '0 0 24px rgba(255,215,0,0.65), 0 0 50px rgba(255,215,0,0.3)'
                    : '0 0 8px rgba(255,215,0,0.1)',
              }}
            >
              <span className="font-h1-heavy italic text-yellow-400 vs-glow text-lg">VS</span>
            </div>
            {/* Impact star — re-mounts on each new message to replay the animation */}
            {currentSpeaker && currentSpeaker !== 'COMMENTATOR' && (
              <div
                key={`burst-${messages.length}`}
                className="absolute inset-0 flex items-center justify-center pointer-events-none animate-impact-burst"
              >
                <span
                  className="text-4xl font-black select-none"
                  style={{ color: '#ffe066', textShadow: '0 0 12px #ffd700, 0 0 28px #ff8800' }}
                >
                  ✦
                </span>
              </div>
            )}
          </div>

          {/* BLUE BOXER */}
          <div
            className={
              currentSpeaker === 'IC'
                ? 'animate-boxer-lunge-left'
                : currentSpeaker === 'MANAGER'
                ? 'animate-boxer-reel-right'
                : 'animate-boxer-bob-delayed'
            }
          >
            <PixelBoxer color="blue" facing="left" punching={currentSpeaker === 'IC'} />
            <div className="text-center mt-1">
              {blueName && <div className="font-black text-[11px] uppercase tracking-wider text-white truncate max-w-[60px]">{blueName}</div>}
              {bluePersona && <div className="font-black text-[9px] uppercase tracking-widest text-blue-400">{bluePersona}</div>}
            </div>
          </div>
        </div>
        {/* ────────────────────────────────────────────────────────────── */}

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 relative">
          <div className={`md:col-span-3 bg-surface-container border-4 border-primary p-4 relative overflow-hidden transition-all duration-300 ${currentSpeaker === 'MANAGER' ? 'ring-4 ring-primary ring-offset-4 ring-offset-black scale-[1.02] bg-primary/10' : ''}`}>
            <div className="absolute top-0 right-0 bg-primary text-on-primary font-black px-4 py-1 skew-x-[-12deg] mr-[-10px] mt-2 z-10 flex items-center gap-2">
              <span>{redHeader}</span>
              {redPersona && <span className="opacity-80">· {redPersona}</span>}
            </div>
            {redName && (
              <div className="font-label-caps text-[10px] text-outline uppercase tracking-widest mt-6 mb-0.5">{redName}</div>
            )}
            <h3 className="font-h1-heavy text-3xl text-white uppercase italic mt-1">{redCard.archetype}</h3>
            {currentSpeaker === 'MANAGER' && (
              <div className="absolute bottom-2 left-4 text-primary font-lexend font-black text-xs uppercase animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                FORMULATING ARGUMENT...
              </div>
            )}
          </div>

          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <div className={`w-20 h-20 rounded-full bg-black border-4 flex items-center justify-center z-10 my-4 transition-colors duration-500 ${currentSpeaker === 'MANAGER' ? 'border-primary shadow-[0_0_30px_rgba(255,59,48,0.6)]' : currentSpeaker === 'IC' ? 'border-secondary-container shadow-[0_0_30px_rgba(10,132,255,0.6)]' : 'border-tertiary vs-glow'}`}>
              <span className={`font-h1-heavy italic transition-colors ${currentSpeaker === 'MANAGER' ? 'text-primary' : currentSpeaker === 'IC' ? 'text-secondary-container' : 'text-tertiary'}`}>VS</span>
            </div>
          </div>

          <div className={`md:col-span-3 bg-surface-container border-4 border-secondary-container p-4 relative overflow-hidden transition-all duration-300 ${currentSpeaker === 'IC' ? 'ring-4 ring-secondary-container ring-offset-4 ring-offset-black scale-[1.02] bg-secondary-container/10' : ''}`}>
            <div className="absolute top-0 left-0 bg-secondary-container text-white font-black px-4 py-1 skew-x-[12deg] ml-[-10px] mt-2 z-10 flex items-center gap-2">
              <span>{blueHeader}</span>
              {bluePersona && <span className="opacity-80">· {bluePersona}</span>}
            </div>
            {blueName && (
              <div className="font-label-caps text-[10px] text-outline uppercase tracking-widest mt-6 mb-0.5 text-right">{blueName}</div>
            )}
            <h3 className="font-h1-heavy text-3xl text-white uppercase italic mt-1 text-right">{blueCard.archetype}</h3>
            {currentSpeaker === 'IC' && (
              <div className="absolute bottom-2 right-4 text-secondary-container font-lexend font-black text-xs uppercase animate-pulse flex items-center gap-2">
                FORMULATING COUNTER...
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-low border-2 border-outline-variant flex flex-col h-[500px] relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.map((msg, i) => {
              const isA = msg.role === 'MANAGER';
              return (
                <div key={msg.id} className={`flex flex-col ${isA ? 'items-start' : 'items-end ml-auto'} max-w-[80%]`}>
                  <span className={`font-label-caps text-[10px] mb-1 uppercase ${isA ? 'text-primary' : 'text-secondary'}`}>
                    {getSpeakerLabel(msg.role)} [{msg.timestamp}]
                  </span>
                  <div className={`p-4 font-body-bold text-body-main relative ${isA ? 'bg-primary-container text-on-primary-container border-l-4 border-primary' : 'bg-secondary-container text-on-secondary-container border-r-4 border-secondary text-right'}`}>
                    {msg.text.replace(/\[.*\]/g, '')}
                    {msg.text.includes('[WALKAWAY]') && <div className="mt-2 text-[10px] font-black uppercase text-white bg-black px-2 py-1 block w-max ml-auto">WALKED AWAY</div>}
                    {msg.text.includes('[AGREEMENT:') && <div className="mt-2 text-[10px] font-black uppercase text-black bg-tertiary px-2 py-1 block w-max">AGREEMENT REACHED</div>}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          {isScrolledUp && (
            <button
              onClick={jumpToLatest}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-primary text-black font-black text-xs uppercase px-4 py-2 shadow-lg animate-bounce flex items-center gap-2 z-10"
            >
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              JUMP TO LATEST
            </button>
          )}
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
          <button
            onClick={handleShare}
            className="w-full bg-secondary-container text-white font-black py-4 uppercase italic flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all border-t-2 border-outline-variant"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'share'}</span>
            {copied ? 'LINK COPIED' : 'SHARE SPECTATOR LINK'}
          </button>
        </div>
      </aside>
    </div>
  );
}
