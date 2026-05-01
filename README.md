# Calendar Combat

Calendar Combat is an AI-powered scheduling game where two people connect their real Google Calendars, pick a fighter persona, and watch autonomous agents negotiate a meeting time live in a "fight arena."

Built for hackathon judging: fast to demo, fun to watch, and grounded in real calendar constraints.

## Why It Matters

- Scheduling is painful and high-frequency in real teams.
- Most calendar tools are utility-first and low-engagement.
- Calendar Combat turns negotiation into a transparent, replayable, AI-assisted decision flow.

## Core Features

- **Real calendar grounding**: proposals are generated and validated against actual Google Calendar availability.
- **Live multiplayer arena**: both participants watch turn-by-turn streaming in real time.
- **Persona-driven negotiation**: each player chooses a fighter persona (Intern, SWE, Team Lead, Director, Executive).
- **Automated commentary and verdict**: AI commentator plus AI judge produce a final ruling.
- **Google Chat updates**: optional broadcast of key fight moments to a Chat space.

## Demo Flow (2-3 minutes)

1. Challenger creates a fight and picks a fighter persona.
2. Opponent joins via link, connects calendar, and picks their fighter.
3. Both set priority constraints.
4. Arena streams the negotiation live.
5. Judge returns a verdict and recommended meeting outcome.

## Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Realtime**: Pusher
- **AI**: Gemini API
- **Integrations**: Google OAuth, Google Calendar, Google Chat webhooks
- **Runtime storage**: lightweight file-backed/in-memory fight state for hackathon speed

## Quick Start

### 1) Install

```bash
npm install
```

### 2) Configure `.env.local`

Required environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GEMINI_API_KEY`
- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- `GOOGLE_CHAT_WEBHOOK_URL` (optional but recommended for demo impact)

Google OAuth redirect URI for local development:

- `http://localhost:3000/api/auth/google/callback`

### 3) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Hackathon Notes

- **Demo mode**: set `DEMO_MODE=true` to bypass real calendar fetching and run deterministic demos.
- **Persistence tradeoff**: state is optimized for speed of development, not long-term durability.
- **Best experience**: run with two browser sessions for live head-to-head interaction.

## What We Would Build Next

- Persistent datastore + match history analytics
- Team-level leaderboard and season rankings
- More negotiation strategies and judge explainability
- One-click deploy presets for event demos
