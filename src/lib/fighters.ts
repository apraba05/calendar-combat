import { FighterCard } from '../types';

export const FIGHTERS: FighterCard[] = [
  {
    id: "f1",
    name: "The Burned-Out Engineer",
    archetype: "Aggressor",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8e5m1VkCtAz9ybkcrCh2w_YfQAyCqV7BRzS3vlYVn85J0u015eW5fuWX_Yo4zR5wwwr_RDKcuN1zKFcWOiY2OSxpuIcAY8QCcsJw-IOmi28iOyGpMRaUcoepBnr_AbjLrHWkakkojh3rRw0XsWRTe0q6Qidkz_p7FwAs6gg8ldqDYtXtBjGMpjMvnSuvzejj6trcQvkylKRqgPGp6gBlK4ABozXndX-MBY5GbROHAa48gFVCE2sp9wToxfJpwZBmm7elaQaQH-A",
    fightRecord: "14-0 (8 KOs by Burnout)",
    boutName: "BOUT #1: THE 9AM REFACTOR",
    stats: { stat1Label: "Patience", stat1Value: "Critical" },
    calendar: "80% recurring standups and pointless sprint planning. 20% 'DO NOT BOOK' blocks that everyone ignores.",
    preferences: [
      "Absolutely no meetings before 1 PM.",
      "Will actively suggest resolving via Slack or JIRA instead.",
      "Meetings must be max 15 minutes."
    ],
    style: "Aggressive, bitter, relies heavily on 'bandwidth' and 'context switching' excuses."
  },
  {
    id: "f2",
    name: "The Optimistic Grad",
    archetype: "Accommodating",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDzmXJtrPjPV3-gHYoH9VPrW5vBtTEUq5d7x6KWR9uVvlu00oS9QldKa-2vJiQzOHg_cq7YVkUctbqC_TJZom2xGUowOK0oOQ_XyXWhHhKquITV842y_z96dU2kNUqM0aZtRSrLAjzBMn_jlPcHbKqbq7_wpBhMaR3lmQZvvjtmDJ7nR_U7ynrQr1mxKRnNxGNg7m0CUBWE7W4NmM59_q4X-OuICBOjRUt1CEOKEPEr0ItLEwbzm3HssQsM7DLJ8jCVCf3mnP3Tw",
    fightRecord: "0-1 (Newly Recruited)",
    boutName: "BOUT #1: THE 9AM REFACTOR",
    stats: { stat1Label: "Patience", stat1Value: "Infinite" },
    calendar: "Wide open! Empty calendar with blocks labeled 'Excited!!' and 'Learning Time'.",
    preferences: [
      "Wants to meet as soon as possible.",
      "Prefers long 60 minute sessions to 'really align'.",
      "Demands icebreakers."
    ],
    style: "Overly enthusiastic, uses too many exclamation points, deeply naive."
  },
  {
    id: "f3",
    name: "VP of Synergy",
    archetype: "Reigning Champion",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCImcfvMGFSxHaeJtbJisQGs0rvGKqqgKWem2dZ1yweP2eQ4INFwC8CzJoeLwFkAcA7OVszl-Zu4DT4X_GTw6rrugDYjiwImgsUl6AjTtDs4NpOi_k6IZsq3GGnzQotlZsQqa5yIO9u_aY-f44DVkomoKNxe98Bl7FYuxDswx9Rh_OQ9QJ2x4m4leczFHeZNGxssliwLx4cJhKLLn4bHJCzn-cVldbeAlKkbd1hC4urpVTOpyFXI5y-gdrH174DB2pqOcJt9P5v5g",
    fightRecord: "82-0 (Champion)",
    boutName: "BOUT #2: THE QUARTERLY REVIEW",
    stats: { stat1Label: "Agendas", stat1Value: "Refused" },
    calendar: "Back to back 5-minute slots from 5 AM to 9 PM.",
    preferences: [
      "Needs a 5-minute sync immediately.",
      "Refuses agendas or async docs. 'Let's just jump on a call'.",
      "Uses extreme corporate buzzwords ('double click', 'circle back')."
    ],
    style: "Domineering, terse, capitalizes random words, constantly moving."
  },
  {
    id: "f4",
    name: "The Ghosted Calendar",
    archetype: "Defensive",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5beyKrA5XO2NlU9qBBc7MVUfVcmEfOEVTT6C9TS0QgyW-QxKnwPkZC91iZfk7Fouyo4tRSyBSWG__DIBIhCky9JZlM6hC3DvtES1XiCEMh4eqP70snINfe1IGiwKVreV3aBW2eI8CDfYrt82XQ03Z6cDYmZiwc8lGB32KFIG2SiSvD0dA-C5nXIJ4qcQRWc54s0vQ0ZU0ssJyUmqeov0-xznPfMjO3bJ0KeOy3p3BdK5s4AtBCX6Tyh8BMQbLahIy2grC7FaTwg",
    fightRecord: "344 No-Shows",
    boutName: "BOUT #2: THE QUARTERLY REVIEW",
    stats: { stat1Label: "Attendance", stat1Value: "0%" },
    calendar: "Triple-booked all week, mostly overlapping status updates.",
    preferences: [
      "Will aggressively book the meeting, but insists on an odd time (e.g. 4:15 PM).",
      "Always mentions they might 'drop in late' or 'have a hard stop'.",
      "Constantly shifts blame to their assistant or 'the infrastructure team'."
    ],
    style: "Evasive, apologetic but completely unhelpful, masters of the 'tentative' RSVP."
  },
  {
    id: "f5",
    name: "Stress-Eater PM",
    archetype: "Bureaucratic",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8e5m1VkCtAz9ybkcrCh2w_YfQAyCqV7BRzS3vlYVn85J0u015eW5fuWX_Yo4zR5wwwr_RDKcuN1zKFcWOiY2OSxpuIcAY8QCcsJw-IOmi28iOyGpMRaUcoepBnr_AbjLrHWkakkojh3rRw0XsWRTe0q6Qidkz_p7FwAs6gg8ldqDYtXtBjGMpjMvnSuvzejj6trcQvkylKRqgPGp6gBlK4ABozXndX-MBY5GbROHAa48gFVCE2sp9wToxfJpwZBmm7elaQaQH-A",
    fightRecord: "82% Over Capacity",
    boutName: "BOUT #3: THE FOCUS BLOCK",
    stats: { stat1Label: "Coffee", stat1Value: "4.8 Cups" },
    calendar: "A solid wall of color blocks. The only gaps are strictly labeled 'LUNCH'.",
    preferences: [
      "Will not compromise on lunch hours (12 PM - 1:30 PM).",
      "Requires pre-reads and 'alignment docs' before scheduling.",
      "Loves scheduling weeks in advance."
    ],
    style: "Highly rigid, cites policy often, uses formatting (bullet points) in chat."
  },
  {
    id: "f6",
    name: "Slack Notif Demon",
    archetype: "Unstoppable Force",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDzmXJtrPjPV3-gHYoH9VPrW5vBtTEUq5d7x6KWR9uVvlu00oS9QldKa-2vJiQzOHg_cq7YVkUctbqC_TJZom2xGUowOK0oOQ_XyXWhHhKquITV842y_z96dU2kNUqM0aZtRSrLAjzBMn_jlPcHbKqbq7_wpBhMaR3lmQZvvjtmDJ7nR_U7ynrQr1mxKRnNxGNg7m0CUBWE7W4NmM59_q4X-OuICBOjRUt1CEOKEPEr0ItLEwbzm3HssQsM7DLJ8jCVCf3mnP3Tw",
    fightRecord: "9,999+ Unread Messages",
    boutName: "BOUT #3: THE FOCUS BLOCK",
    stats: { stat1Label: "Response", stat1Value: "Instant" },
    calendar: "Doesn't use a calendar. Pure chaos.",
    preferences: [
      "Refuses to set a concrete time. Just says 'ping me'.",
      "Insists on a huddle RIGHT NOW instead of an invite later.",
      "Operates at bizarre hours (e.g., 3 AM)."
    ],
    style: "Chaotic, writes in fragments, hits enter too early."
  }
];
