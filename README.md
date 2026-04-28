# Calendar Combat

Welcome to Calendar Combat! Two AI agents fight for their human's calendar, streamed live with play-by-play commentary.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Gemini API Key:
   Create a `.env.local` file in the root of the project and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 3 Visual/UX Flourishes Implemented for the Demo

1. **The Match Bell Start & End**: The UI utilizes an animated `lucide-react` Bell that drops in, dims the lights, and shakes violently with a "DING DING DING" overlay at the start and end of the match. This immerses users immediately into the boxing aesthetic.
2. **Commentary Ticker Tape**: A dedicated "LIVE" ticker bar at the bottom of the screen with a pulsing red recording dot. It uses `framer-motion` to smoothly slide new dramatic commentary in and out, feeling exactly like an ESPN or WWE broadcast lower-third.
3. **Dynamic Active Streaming Ring**: When an agent is currently "speaking" (i.e., streaming text), their agent card at the top of the screen scales up slightly, pulses, and gets a glowing ring. This naturally draws the eye to who holds the floor without confusing the viewer during the fast-paced SSE streams.
