"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';

type PriorityLevel = 'must_keep' | 'important' | 'flexible';

interface CalEvent {
  eventId: string;
  summary: string;
  start: string;
  end: string;
  isRecurring: boolean;
  attendeesCount: number;
}

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; shortLabel: string; activeClass: string; badgeClass: string }> = {
  must_keep: {
    label: 'NON-NEGOTIABLE',
    shortLabel: 'NON-NEG',
    activeClass: 'border-primary bg-primary/20 text-primary',
    badgeClass: 'text-primary border-primary',
  },
  important: {
    label: 'IMPORTANT',
    shortLabel: 'IMPORTANT',
    activeClass: 'border-tertiary bg-tertiary/20 text-tertiary',
    badgeClass: 'text-tertiary border-tertiary',
  },
  flexible: {
    label: 'FLEXIBLE',
    shortLabel: 'FLEXIBLE',
    activeClass: 'border-green-500 bg-green-900/20 text-green-400',
    badgeClass: 'text-green-400 border-green-500',
  },
};

function EventCard({
  event,
  priority,
  onChange,
}: {
  event: CalEvent;
  priority: PriorityLevel;
  onChange: (p: PriorityLevel) => void;
}) {
  const start = new Date(event.start);
  const dayLabel = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const cfg = PRIORITY_CONFIG[priority];

  return (
    <div className={`bg-surface-container border-2 p-4 transition-colors duration-150 ${priority === 'must_keep' ? 'border-primary/60' : priority === 'important' ? 'border-tertiary/50' : 'border-outline-variant'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-lexend font-black text-white text-sm uppercase truncate">{event.summary}</div>
          <div className="text-outline text-[10px] mt-0.5 font-label-caps flex items-center gap-2">
            <span>{dayLabel} · {timeLabel}</span>
            {event.isRecurring && <span className="text-outline-variant">↺ RECURRING</span>}
            {event.attendeesCount > 1 && <span className="text-outline-variant">{event.attendeesCount} attendees</span>}
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase border px-2 py-0.5 shrink-0 ${cfg.badgeClass}`}>
          {cfg.shortLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(Object.entries(PRIORITY_CONFIG) as [PriorityLevel, typeof PRIORITY_CONFIG[PriorityLevel]][]).map(([key, c]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`py-2 text-[10px] font-black uppercase border-2 transition-all ${priority === key ? c.activeClass : 'border-outline-variant/40 text-outline-variant hover:border-outline-variant'}`}
          >
            {c.shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Priorities({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [priorities, setPriorities] = useState<Record<string, PriorityLevel>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/fight/${params.fightId}/priorities`)
      .then(r => {
        if (r.status === 401) { window.location.href = `/api/auth/google?action=join&fightId=${params.fightId}`; return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        const evts: CalEvent[] = data.events || [];
        setEvents(evts);
        const defaults: Record<string, PriorityLevel> = {};
        evts.forEach(e => { defaults[e.eventId] = 'flexible'; });
        setPriorities(defaults);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`fight-${params.fightId}`);
    channel.bind('priorities-complete', () => {
      router.push(`/fight/${params.fightId}/tape`);
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`fight-${params.fightId}`);
    };
  }, [params.fightId, router]);

  const handleSubmit = async () => {
    const payload = events.map(e => ({
      eventId: e.eventId,
      summary: e.summary,
      start: e.start,
      end: e.end,
      priority: priorities[e.eventId] ?? 'flexible',
    }));

    const res = await fetch(`/api/fight/${params.fightId}/priorities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priorities: payload }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      setError('Failed to save your battle plan. Try again.');
    }
  };

  // Split events: this week (days 0-6) vs next week (days 7-14)
  const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const thisWeek = events.filter(e => new Date(e.start) < cutoff);
  const nextWeek = events.filter(e => new Date(e.start) >= cutoff);

  const mustKeepCount = Object.values(priorities).filter(p => p === 'must_keep').length;
  const importantCount = Object.values(priorities).filter(p => p === 'important').length;

  if (loading) {
    return (
      <div className="min-h-screen canvas-bg flex flex-col items-center justify-center gap-4">
        <h2 className="font-h1-heavy text-white text-3xl italic uppercase animate-pulse">SCANNING YOUR CALENDAR...</h2>
        <div className="w-64 h-1 bg-surface-container overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen canvas-bg flex flex-col items-center justify-center gap-6 p-8">
        <div className="caution-strip h-4 w-64" />
        <h2 className="font-h1-heavy text-white text-5xl italic uppercase text-center">BATTLE PLAN LOCKED</h2>
        <div className="bg-surface-container border-2 border-outline-variant p-6 max-w-sm w-full text-center">
          <p className="text-outline font-body-main text-sm mb-4">Your bot has its marching orders.</p>
          <div className="flex justify-center gap-6 text-sm font-black uppercase">
            <div className="text-primary">{mustKeepCount} NON-NEG</div>
            <div className="text-tertiary">{importantCount} IMPORTANT</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-outline-variant text-sm animate-pulse">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          WAITING FOR OPPONENT TO SET THEIR PLAN...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen canvas-bg p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="caution-tape h-4 w-full mb-8" />

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-lexend font-black text-5xl italic text-white uppercase tracking-tight">
            SET YOUR BATTLE PLAN
          </h1>
          <p className="text-outline font-body-main mt-3 max-w-xl mx-auto">
            Mark your non-negotiable calendar events. Your bot will fight hardest to protect these slots — everything else is fair game.
          </p>

          {/* Live summary */}
          {events.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm font-black uppercase">
                <div className="w-3 h-3 bg-primary" />
                <span className="text-primary">{mustKeepCount} non-negotiable</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-black uppercase">
                <div className="w-3 h-3 bg-tertiary" />
                <span className="text-tertiary">{importantCount} important</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-black uppercase">
                <div className="w-3 h-3 bg-green-500" />
                <span className="text-green-400">{events.length - mustKeepCount - importantCount} flexible</span>
              </div>
            </div>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-surface-container border-2 border-outline-variant max-w-lg mx-auto">
            <span className="material-symbols-outlined text-4xl text-outline mb-4 block">event_busy</span>
            <p className="text-outline font-body-main">No upcoming events found for the next two weeks.</p>
            <p className="text-outline-variant text-sm mt-2">Your bot will negotiate purely on availability.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* THIS WEEK */}
            <div>
              <div className="bg-primary text-on-primary font-h1-heavy italic uppercase p-3 mb-4 flex items-center justify-between">
                <span>THIS WEEK</span>
                <span className="text-sm font-body-bold not-italic">{thisWeek.length} events</span>
              </div>
              <div className="space-y-3">
                {thisWeek.length === 0 ? (
                  <p className="text-outline font-body-main text-sm p-4 bg-surface-container border border-outline-variant">
                    No events this week.
                  </p>
                ) : (
                  thisWeek.map(e => (
                    <EventCard
                      key={e.eventId}
                      event={e}
                      priority={priorities[e.eventId] ?? 'flexible'}
                      onChange={p => setPriorities(prev => ({ ...prev, [e.eventId]: p }))}
                    />
                  ))
                )}
              </div>
            </div>

            {/* NEXT WEEK */}
            <div>
              <div className="bg-secondary-container text-white font-h1-heavy italic uppercase p-3 mb-4 flex items-center justify-between">
                <span>NEXT WEEK</span>
                <span className="text-sm font-body-bold not-italic">{nextWeek.length} events</span>
              </div>
              <div className="space-y-3">
                {nextWeek.length === 0 ? (
                  <p className="text-outline font-body-main text-sm p-4 bg-surface-container border border-outline-variant">
                    No events next week.
                  </p>
                ) : (
                  nextWeek.map(e => (
                    <EventCard
                      key={e.eventId}
                      event={e}
                      priority={priorities[e.eventId] ?? 'flexible'}
                      onChange={p => setPriorities(prev => ({ ...prev, [e.eventId]: p }))}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-center font-bold mb-4">{error}</p>}

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className="bg-tertiary text-black font-black text-2xl py-6 px-20 uppercase italic hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,0,0,1)] border-4 border-black skew-x-[-4deg]"
          >
            LOCK IN BATTLE PLAN
          </button>
        </div>
      </div>
    </div>
  );
}
