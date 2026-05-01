"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerdictData } from '@/types';

export default function Verdict({ params }: { params: { fightId: string } }) {
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchVerdict = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/verdict`);
      if (res.ok) setVerdict(await res.json());
    };
    fetchVerdict();
  }, [params.fightId]);

  const handleEmailSummary = () => {
    if (!verdict) return;
    const status = verdict.meetingDetails.status;
    const subject = encodeURIComponent(`[Calendar Combat] Fight Summary — ${status}`);
    const meetingLine = status === 'AGREEMENT REACHED'
      ? `📅 Meeting Scheduled: ${verdict.meetingDetails.date} at ${verdict.meetingDetails.time} (${verdict.meetingDetails.durationMinutes} min)`
      : `❌ No meeting was scheduled. Result: ${status}`;

    const body = encodeURIComponent(
`CALENDAR COMBAT — FIGHT SUMMARY
================================
Fight ID: ${params.fightId}
Outcome: ${status}
Winner: ${verdict.winnerName}

${meetingLine}

--- SCORECARD ---
Persistence: ${verdict.stats.persistence}/100
Passive Aggression: ${verdict.stats.passiveAggression}/100
Scheduling Brutality: ${verdict.stats.schedulingBrutality}/100
BCC Lethality: ${verdict.stats.bccLethality}/100

--- SAVAGE QUOTE ---
"${verdict.savageQuote}"

View the full replay at: ${window.location.origin}/replays/${params.fightId}
`);

    const to = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setEmailSent(true);
    setShowEmailModal(false);
  };

  if (!verdict) return <div className="min-h-screen canvas-bg flex justify-center items-center"><h1 className="text-4xl text-primary font-lexend uppercase italic animate-pulse">GENERATING VERDICT...</h1></div>;

  return (
    <div className="min-h-screen canvas-bg p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl bg-surface-container border-8 border-outline-variant p-8 shadow-[20px_20px_0px_#000] relative">
        <div className="absolute top-0 left-0 w-full h-8 caution-tape"></div>
        <h1 className="font-lexend font-black text-6xl text-white uppercase italic text-center mt-8 mb-4">DECISION RENDERED</h1>
        
        <div className="bg-black border-2 border-primary p-6 mb-8 text-center">
          <h2 className="font-label-caps text-secondary uppercase tracking-widest mb-2">WINNER</h2>
          <h3 className="font-h1-heavy text-5xl text-tertiary uppercase italic">{verdict.winnerName}</h3>
          <p className="text-outline-variant text-sm mt-2 font-label-caps tracking-widest">{verdict.meetingDetails.status}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { label: 'PERSISTENCE', value: verdict.stats.persistence, color: 'bg-primary' },
            { label: 'PASSIVE AGGRESSION', value: verdict.stats.passiveAggression, color: 'bg-secondary' },
            { label: 'SCHEDULING BRUTALITY', value: verdict.stats.schedulingBrutality, color: 'bg-red-600' },
            { label: 'BCC LETHALITY', value: verdict.stats.bccLethality, color: 'bg-tertiary' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-container-highest p-4 border border-outline-variant">
              <p className="text-outline text-xs uppercase font-bold mb-2">{stat.label}</p>
              <div className="h-4 bg-black"><div className={`h-full ${stat.color} transition-all`} style={{width: `${stat.value}%`}}></div></div>
              <p className="text-outline-variant text-right text-xs mt-1">{stat.value}/100</p>
            </div>
          ))}
        </div>

        <div className="bg-black p-6 border-l-4 border-tertiary mb-8">
          <p className="font-transcript-mono text-tertiary italic">"{verdict.savageQuote}"</p>
        </div>

        {verdict.meetingDetails.status === 'AGREEMENT REACHED' && (
          <div className="bg-white p-6 shadow-2xl relative mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-blue-600 p-2 text-white"><span className="material-symbols-outlined">calendar_month</span></div>
              <div>
                <h3 className="font-body-bold text-black text-xl">Meeting Scheduled</h3>
                <p className="text-slate-500 font-mono">{verdict.meetingDetails.date} • {verdict.meetingDetails.time} • {verdict.meetingDetails.durationMinutes} min</p>
              </div>
            </div>
            <a 
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Calendar Combat Result')}&details=${encodeURIComponent('Scheduled via Calendar Combat')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 text-white font-bold py-3 uppercase hover:bg-blue-700 transition-colors"
            >
              ADD TO GOOGLE CALENDAR
            </a>
          </div>
        )}

        {/* Email Summary Button */}
        {showEmailModal ? (
          <div className="bg-surface-container border-2 border-outline-variant p-6 mb-6 flex flex-col gap-4">
            <h3 className="font-lexend font-black text-white uppercase italic">SEND FIGHT SUMMARY</h3>
            <input
              type="email"
              placeholder="Recipient email (leave blank to open your email app)"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              className="bg-black border-2 border-outline-variant p-4 text-white focus:border-primary focus:outline-none font-body-bold w-full"
            />
            <div className="flex gap-4">
              <button onClick={handleEmailSummary} className="flex-1 bg-primary text-black font-black py-3 uppercase italic hover:bg-white transition-colors">
                SEND EMAIL SUMMARY
              </button>
              <button onClick={() => setShowEmailModal(false)} className="px-6 border-2 border-outline-variant text-white font-bold hover:border-white transition-colors">
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowEmailModal(true)} 
            className={`w-full mb-4 border-2 font-black text-lg py-4 uppercase italic transition-all flex items-center justify-center gap-3 ${emailSent ? 'border-green-500 text-green-500' : 'border-outline-variant text-white hover:border-white'}`}
          >
            <span className="material-symbols-outlined">mail</span>
            {emailSent ? '✓ SUMMARY SENT' : 'EMAIL FIGHT SUMMARY'}
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
  );
}
