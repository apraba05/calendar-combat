# Calendar Combat

Calendar Combat is a hackathon project that turns the mundane reality of corporate scheduling into an automated, high-stakes pay-per-view blood sport. Two real users connect their Google Calendars, and their AI agents negotiate a meeting time live in a boxing-match arena, broadcasting play-by-play to Google Chat.

## Features
- **Real Calendar Data**: Uses Google OAuth 2.0 to read real events and validate agent proposals against actual availability.
- **Pusher Multiplayer**: Real-time server-to-client streaming so both users see the fight unfold synchronously.
- **Google Chat Broadcast**: Fire-and-forget webhook integration posts formatted cards to a Chat Space.
- **Gemini Autonomous Loop**: A background orchestrator runs the agents in a tight loop.

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Variables**
   Copy `.env.local` and fill in the missing keys:
   
   - **Pusher**: Create an app at pusher.com. Fill in `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, and the cluster.
   - **Google Cloud**: Create an OAuth 2.0 Client ID for Web Applications. 
     - Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
     - Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
   - **Google Chat**: Go to a Chat space > Apps & Integrations > Manage webhooks. Create one and paste the URL into `GOOGLE_CHAT_WEBHOOK_URL`.
   - **Gemini API**: Get a key from Google AI Studio and put it in `GEMINI_API_KEY`.

3. **Run Locally**
   \`\`\`bash
   npm run dev
   \`\`\`

## Architecture Notes
- **No Database**: We use in-memory `Map` objects (`fightStore` and `sessionStore`) for hackathon speed. **Server restarts will wipe active fights.**
- **Demo Mode**: If Google Auth is difficult to set up during the hackathon, set `DEMO_MODE="true"` in `.env.local`. This will bypass calendar fetching and inject fake availability for testing the arena loop.
- **Vercel Deployment**: To deploy to Vercel, ensure you configure the environment variables in the Vercel dashboard and update the `GOOGLE_REDIRECT_URI` to your Vercel domain. Note that Vercel serverless functions have timeouts, so `maxDuration` is set to 300 on the `/start` route.
