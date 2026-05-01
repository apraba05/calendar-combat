"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface JudgeVerdict {
  winnerRole: 'MANAGER' | 'IC' | 'DRAW';
  winnerName: string;
  judgeRationale: string;
  judgeQuote: string;
  recommendMeeting: boolean;
  recommendedTime: string | null;
  conflictsFound: string[];
  stats: { persistence: number; passiveAggression: number; schedulingBrutality: number; bccLethality: number };
  savageQuote: string;
  meetingDetails: { date: string; time: string; durationMinutes: number; status: string };
}

export default function Verdict({ params }: { params: { fightId: string } }) {
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [decision, setDecision] = useState<'scheduled' | 'skipped' | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchVerdict = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/verdict`);
      if (res.ok) setVerdict(await res.json());
    };
    fetchVerdict();
  }, [params.fightId]);

  const handleSchedule = () => {
    if (!verdict?.recommendedTime) return;
    const start = new Date(verdict.recommendedTime);
    const end = new Date(start.getTime() + verdict.meetingDetails.durationMinutes * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(verdict.meetingDetails.status === 'MEETING RECOMMENDED' ? 'Scheduled via Calendar Combat' : 'Meeting')}&dates=${fmt(start)}/${fmt(end)}`;
    window.open(url, '_blank');
    setDecision('scheduled');
  };

  const handleEmailSummary = () => {
    if (!verdict) return;
    const subject = encodeURIComponent(`[Calendar Combat] AI Judge Ruling — ${verdict.meetingDetails.status}`);
    const body = encodeURIComponent(
`CALENDAR COMBAT — AI JUDGE RULING
===================================
Fight ID: ${params.fightId}
Judge's Ruling: ${verdict.winnerName} WINS
Recommendation: ${verdict.meetingDetails.status}
${verdict.recommendedTime ? `Recommended Time: ${verdict.recommendedTime}` : ''}

--- JUDGE'S RATIONALE ---
${verdict.judgeRationale}

--- JUDGE'S QUOTE ---
"${verdict.judgeQuote}"

${verdict.conflictsFound.length > 0 ? `--- CONFLICTS IDENTIFIED ---\n${verdict.conflictsFound.join('\n')}` : '--- NO CONFLICTS FOUND ---'}

--- SCORECARD ---
Persistence: ${verdict.stats.persistence}/100
Passive Aggression: ${verdict.stats.passiveAggression}/100
Scheduling Brutality: ${verdict.stats.schedulingBrutality}/100
BCC Lethality: ${verdict.stats.bccLethality}/100

View the full replay: ${window.location.origin}/replays/${params.fightId}
`);
    const to = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setEmailSent(true);
    setShowEmailModal(false);
  };

  if (!verdict) return (
    <div className="min-h-screen canvas-bg flex flex-col justify-center items-center gap-6">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <h1 className="text-3xl text-primary font-lexend uppercase italic animate-pulse">THE JUDGE IS DELIBERATING...</h1>
    </div>
  );

  const rulingColor = verdict.winnerRole === 'MANAGER' ? 'border-red-600 text-red-500' : verdict.winnerRole === 'IC' ? 'border-blue-500 text-blue-400' : 'border-amber-400 text-amber-400';
  const hasConflicts = verdict.conflictsFound.length > 0;

  return (
    <div className="min-h-screen canvas-bg p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">

        {/* Judge's Gavel Header */}
        <div className="relative bg-surface-container border-8 border-outline-variant p-8 shadow-[20px_20px_0px_#000]">
          <div className="absolute top-0 left-0 w-full h-8 caution-tape"></div>
          <div className="text-center mt-6">
            <span className="material-symbols-outlined text-6xl text-amber-400 mb-4 block">gavel</span>
            <h1 className="font-lexend font-black text-5xl text-white uppercase italic">JUDGE'S VERDICT</h1>
            <p className="text-outline-variant text-sm font-label-caps tracking-widest mt-2">AI ARBITRATION COMPLETE</p>
          </div>
        </div>

        {/* Ruling Banner */}
        <div className={`bg-surface-container border-4 ${rulingColor.split(' ')[0]} p-8 text-center shadow-[10px_10px_0px_#000]`}>
          <p className="font-label-caps text-outline-variant text-xs tracking-widest mb-2">RULING</p>
          <h2 className={`font-lexend font-black text-6xl italic uppercase ${rulingColor.split(' ')[1]}`}>{verdict.winnerName}</h2>
          <div className="mt-4 bg-black p-4 border-l-4 border-amber-400">
            <p className="text-white font-body-main italic leading-relaxed">{verdict.judgeRationale}</p>
          </div>
          <p className="text-amber-400 font-transcript-mono text-sm mt-4 italic">"{verdict.judgeQuote}"</p>
        </div>

        {/* Human Decision Section */}
        {decision === null ? (
          <div className="bg-surface-container border-4 border-outline-variant p-8 shadow-[10px_10px_0px_#000]">
            <h3 className="font-lexend font-black text-2xl text-white uppercase italic mb-2">
              {verdict.recommendMeeting ? '⚡ JUDGE RECOMMENDS: SCHEDULE THIS MEETING' : '🚫 JUDGE RECOMMENDS: SKIP THIS MEETING'}
            </h3>
            {verdict.recommendedTime && (
              <p className="text-outline-variant font-label-caps text-sm mb-4">PROPOSED TIME: <span className="text-white">{verdict.recommendedTime}</span></p>
            )}

            {/* Conflict Display */}
            {hasConflicts ? (
              <div className="mb-6 bg-red-900/20 border-2 border-red-600 p-4">
                <p className="font-label-caps text-red-500 text-xs tracking-widest mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  CONFLICTS DETECTED AT PROPOSED TIME
                </p>
                <ul className="flex flex-col gap-2">
                  {verdict.conflictsFound.map((conflict, i) => (
                    <li key={i} className="text-white font-body-main text-sm border-l-2 border-red-500 pl-3">{conflict}</li>
                  ))}
                </ul>
                <p className="text-red-400 text-xs mt-3 font-label-caps">SCHEDULING THIS MEETING WILL DISPLACE THESE EVENTS. YOUR CALL.</p>
              </div>
            ) : (
              <div className="mb-6 bg-green-900/20 border-2 border-green-600 p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-400 text-2xl">check_circle</span>
                <p className="text-green-400 font-label-caps text-sm tracking-widest">NO CONFLICTS — BOTH CALENDARS ARE CLEAR AT THE PROPOSED TIME.</p>
              </div>
            )}

            {/* Human Decision Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleSchedule}
                disabled={!verdict.recommendedTime}
                className="bg-green-700 text-white font-black text-xl py-6 uppercase italic hover:bg-green-500 transition-colors shadow-[5px_5px_0px_#000] flex items-center justify-center gap-3 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">calendar_add_on</span>
                SCHEDULE IT
              </button>
              <button
                onClick={() => setDecision('skipped')}
                className="bg-surface-container-highest border-4 border-outline-variant text-white font-black text-xl py-6 uppercase italic hover:border-white transition-colors shadow-[5px_5px_0px_#000] flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">close</span>
                SKIP IT
              </button>
            </div>
          </div>
        ) : (
          <div className={`border-4 p-8 text-center shadow-[10px_10px_0px_#000] ${decision === 'scheduled' ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-600'}`}>
            <span className={`material-symbols-outlined text-6xl mb-4 block ${decision === 'scheduled' ? 'text-green-400' : 'text-red-500'}`}>
              {decision === 'scheduled' ? 'event_available' : 'event_busy'}
            </span>
            <h3 className={`font-lexend font-black text-4xl italic uppercase ${decision === 'scheduled' ? 'text-green-400' : 'text-red-500'}`}>
              {decision === 'scheduled' ? 'MEETING SCHEDULED' : 'MEETING SKIPPED'}
            </h3>
            <p className="text-outline-variant mt-2 font-label-caps tracking-widest text-sm">
              {decision === 'scheduled' ? 'CHECK YOUR GOOGLE CALENDAR FOR THE INVITE.' : 'THE JUDGE\'S RULING STANDS. NO MEETING.'}
            </p>
          </div>
        )}

        {/* Scorecard */}
        <div className="bg-surface-container border-4 border-outline-variant p-6 shadow-[10px_10px_0px_#000]">
          <h3 className="font-lexend font-black text-xl text-white uppercase italic mb-4 border-b border-outline-variant pb-3">FIGHT SCORECARD</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'PERSISTENCE', value: verdict.stats.persistence, color: 'bg-primary' },
              { label: 'PASSIVE AGGRESSION', value: verdict.stats.passiveAggression, color: 'bg-secondary' },
              { label: 'SCHEDULING BRUTALITY', value: verdict.stats.schedulingBrutality, color: 'bg-red-600' },
              { label: 'BCC LETHALITY', value: verdict.stats.bccLethality, color: 'bg-tertiary' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-container-highest p-4 border border-outline-variant">
                <p className="text-outline text-xs uppercase font-bold mb-2">{stat.label}</p>
                <div className="h-3 bg-black"><div className={`h-full ${stat.color}`} style={{width: `${stat.value}%`}}></div></div>
                <p className="text-outline-variant text-right text-xs mt-1">{stat.value}/100</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col gap-3">
          {showEmailModal ? (
            <div className="bg-surface-container border-2 border-outline-variant p-6 flex flex-col gap-4">
              <h3 className="font-lexend font-black text-white uppercase italic">EMAIL JUDGE'S RULING</h3>
              <input
                type="email"
                placeholder="Recipient email (leave blank to open your mail app)"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none w-full"
              />
              <div className="flex gap-4">
                <button onClick={handleEmailSummary} className="flex-1 bg-primary text-black font-black py-3 uppercase italic hover:bg-white transition-colors">SEND</button>
                <button onClick={() => setShowEmailModal(false)} className="px-6 border-2 border-outline-variant text-white font-bold hover:border-white transition-colors">CANCEL</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEmailModal(true)}
              className={`w-full border-2 font-black py-4 uppercase italic transition-all flex items-center justify-center gap-3 ${emailSent ? 'border-green-500 text-green-500' : 'border-outline-variant text-white hover:border-white'}`}
            >
              <span className="material-symbols-outlined">mail</span>
              {emailSent ? '✓ RULING SENT' : 'EMAIL JUDGE\'S RULING'}
            </button>
          )}
          <div className="flex gap-4">
            <button onClick={() => router.push(`/replays/${params.fightId}`)} className="flex-1 border-2 border-outline-variant text-white font-black py-4 uppercase italic hover:border-white transition-colors">
              VIEW FULL REPLAY
            </button>
            <button onClick={() => router.push('/')} className="flex-1 bg-primary text-black font-black text-xl py-4 uppercase italic skew-x-[-4deg] hover:bg-white shadow-[5px_5px_0px_#000] transition-colors">
              REMATCH
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
