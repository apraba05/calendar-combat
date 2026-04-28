import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { FIGHTERS } from '@/lib/fighters';
import { generateAgentPrompt, generateCommentatorPrompt } from '@/lib/prompts';
import { getStore } from '@/lib/store';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { matchupId, agentA, agentB } = await req.json();

  // Pre-initialize store state to allow pendingInstructions before first turn
  const store = getStore();
  if (!store.has(matchupId)) {
    store.set(matchupId, { matchupId, agentAId: agentA.id, agentBId: agentB.id, messages: [], status: 'ongoing' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-2.5-flash';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      };

      const chatHistory: { role: string; text: string; timestamp: string }[] = [];
      let matchStatus = 'ongoing';
      let turns = 0;
      const MAX_TURNS = 12;

      const runTurn = async (role: 'agentA' | 'agentB') => {
        const agent = role === 'agentA' ? agentA : agentB;
        const opponent = role === 'agentA' ? agentB : agentA;
        const isA = role === 'agentA';
        
        let extraContext = '';
        const store = getStore();
        const state = store.get(matchupId);
        if (isA && state?.pendingInstruction) {
          extraContext = `[COACH'S NOTE — RECEIVED MID-FIGHT]: "${state.pendingInstruction}". Incorporate this into your strategy on your next message without breaking character or quoting the coach directly.\n\n`;
          state.pendingInstruction = undefined;
          store.set(matchupId, state);
        }
        
        const systemInstruction = generateAgentPrompt(agent, opponent, isA) + '\n\n' + extraContext;
        
        const historyText = chatHistory.length > 0 
          ? chatHistory.map(m => `${m.role === 'agentA' ? agentA.name : (m.role === 'agentB' ? agentB.name : 'Commentator')}: ${m.text}`).join('\n')
          : "No messages yet. You start the conversation.";

        const prompt = `Here is the conversation history:\n${historyText}\n\nNow, generate your next response. Max 3 sentences. Do not break character. Do not forget to use [AGREEMENT: ...] or [WALKAWAY] if termination conditions are met.`;

        const id = Math.random().toString(36).substring(7);
        sendEvent('start_turn', { role, id });

        try {
          const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.9,
            }
          });

          let fullResponse = '';
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullResponse += text;
              sendEvent('chunk', { role, text });
            }
          }
          sendEvent('end_turn', { role, id });
          chatHistory.push({ role, text: fullResponse, timestamp: new Date().toISOString() });

          if (fullResponse.includes('[AGREEMENT:') || fullResponse.includes('[WALKAWAY]')) {
            matchStatus = 'finished';
          }
        } catch (e) {
          console.error("Gemini Error", e);
          sendEvent('chunk', { role, text: "[Connection Lost...]" });
          matchStatus = 'finished';
        }
      };

      const runCommentator = async () => {
        const historyText = chatHistory.slice(-2).map(m => `${m.role === 'agentA' ? agentA.name : agentB.name}: ${m.text}`).join('\n');
        const prompt = generateCommentatorPrompt(historyText);

        const id = Math.random().toString(36).substring(7);
        sendEvent('start_turn', { role: 'commentator', id });

        try {
          const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
            config: { temperature: 0.8 }
          });

          let fullResponse = '';
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullResponse += text;
              sendEvent('chunk', { role: 'commentator', text });
            }
          }
          sendEvent('end_turn', { role: 'commentator', id });
          chatHistory.push({ role: 'commentator', text: fullResponse, timestamp: new Date().toISOString() });
        } catch (e) {
          console.error("Gemini Error", e);
        }
      };

      try {
        while (matchStatus === 'ongoing' && turns < MAX_TURNS) {
          await runTurn('agentA');
          if (matchStatus === 'finished') break;

          if (turns % 2 === 0) {
             await runCommentator();
          }

          await runTurn('agentB');
          if (matchStatus === 'finished') break;

          if (turns % 2 === 1) {
             await runCommentator();
          }

          turns++;
        }

        // Save final state
        const finalState = store.get(matchupId);
        if (finalState) {
          finalState.status = 'finished';
          finalState.messages = chatHistory as any;
          store.set(matchupId, finalState);
        }

        sendEvent('verdict_ready', { matchupId });
        
      } catch (e) {
        console.error("Match error", e);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
