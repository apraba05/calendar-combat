import { PersonalityCard } from '../types';

export const PERSONALITIES: PersonalityCard[] = [
  {
    id: "p1",
    name: "Alex 'The Wall' Chen",
    archetype: "Burned-Out Senior Engineer",
    calendar: "9am: Existential Dread (recurring)\n10am-1pm: Core Focus Time (DO NOT BOOK)\n2pm: Arguing with PMs",
    preferences: [
      "Refuses all meetings before 1 PM.",
      "Will not accept meetings longer than 15 minutes.",
      "Demands an agenda for any sync."
    ],
    style: "Passive-aggressive and highly protective of focus time. Uses a lot of sighing in text.",
    stats: {
      meetingsThisWeek: 17,
      patienceLevel: "Critical",
      powerMove: "Declining without comment"
    }
  },
  {
    id: "p2",
    name: "Jamie 'Let's Connect' Rivera",
    archetype: "Optimistic New Grad",
    calendar: "8am: Virtual Coffee\n10am: All-Hands\n2pm: Brainstorming Vibes\n4pm: Feedback Session",
    preferences: [
      "Wants to meet ASAP.",
      "Prefers 45-60 minute sessions to 'really dive deep'.",
      "Always suggests adding icebreakers."
    ],
    style: "Overly accommodating, enthusiastic, uses way too many exclamation points.",
    stats: {
      meetingsThisWeek: 4,
      patienceLevel: "Infinite",
      powerMove: "Suggesting an icebreaker"
    }
  },
  {
    id: "p3",
    name: "Taylor 'Quick Sync' Sterling",
    archetype: "CEO Who Says 'Quick Sync'",
    calendar: "Back-to-back 5-minute slots from 6 AM to 8 PM.",
    preferences: [
      "Needs a 5-minute meeting RIGHT NOW or tomorrow at 6 AM.",
      "Will not accept anything over 10 minutes.",
      "Refuses to read async docs."
    ],
    style: "Blunt, terse, and perpetually rushing. Capitalizes random words for emphasis.",
    stats: {
      meetingsThisWeek: 82,
      patienceLevel: "Zero",
      powerMove: "Calling unannounced"
    }
  },
  {
    id: "p4",
    name: "Sam 'Async First' Wright",
    archetype: "IC Who Has Read The Research",
    calendar: "Completely empty. All blocks are marked 'Async Work'.",
    preferences: [
      "Will actively try to resolve the issue via a shared doc instead of meeting.",
      "If a meeting is forced, only accepts Tuesdays at 3 PM.",
      "Requires prereading materials 24 hours in advance."
    ],
    style: "Academic, condescendingly polite, constantly cites 'studies on productivity'.",
    stats: {
      meetingsThisWeek: 1,
      patienceLevel: "Low",
      powerMove: "Sending a Notion link"
    }
  },
  {
    id: "p5",
    name: "Jordan 'Where Am I' Lee",
    archetype: "Four-Timezone Nomad",
    calendar: "Who knows? Currently operating in UTC+8 but claims EST.",
    preferences: [
      "Can only meet at bizarre hours (e.g., 2 AM EST or 11 PM PST).",
      "Will constantly remind you about their current scenic location.",
      "Needs a flexible start time due to 'unreliable island wifi'."
    ],
    style: "Chill but completely unhelpful with logistics. Frequently mixes up timezones.",
    stats: {
      meetingsThisWeek: 5,
      patienceLevel: "High",
      powerMove: "Flexing the beach view"
    }
  },
  {
    id: "p6",
    name: "Morgan 'EST Default' Davis",
    archetype: "Timezone Denier",
    calendar: "Standard 9-5 EST. Nothing else exists.",
    preferences: [
      "Refuses to acknowledge timezones. Just says 'Let's do 10'.",
      "Hard stop at 5 PM EST, no exceptions.",
      "Thinks everyone else's timezone is 'cute'."
    ],
    style: "Stubborn and slightly arrogant about East Coast supremacy.",
    stats: {
      meetingsThisWeek: 35,
      patienceLevel: "Medium",
      powerMove: "Assuming you mean EST"
    }
  }
];
