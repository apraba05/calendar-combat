import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PERSONALITIES } from '@/lib/personalities';
import { generateAgentPrompt, generateCommentatorPrompt } from '@/lib/prompts';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { agentA: aId, agentB: bId } = await req.json();
  const agentA = PERSONALITIES.find(p => p.id === aId) || PERSONALITIES[0];
  const agentB = PERSONALITIES.find(p => p.id === bId) || PERSONALITIES[1];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-2.5-flash';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      };

      const chatHistory: { role: string; text: string }[] = [];
      let matchStatus = 'ongoing';
      let turns = 0;
      const MAX_TURNS = 8;

      const runTurn = async (role: 'agentA' | 'agentB') => {
        const agent = role === 'agentA' ? agentA : agentB;
        const opponent = role === 'agentA' ? agentB : agentA;
        const isA = role === 'agentA';
        
        const systemInstruction = generateAgentPrompt(agent, opponent, isA);
        
        const historyText = chatHistory.length > 0 
          ? chatHistory.map(m => `${m.role === 'agentA' ? agentA.name : (m.role === 'agentB' ? agentB.name : 'Commentator')}: ${m.text}`).join('\n')
          : "No messages yet. You start the conversation.";

        const prompt = `Here is the conversation history:\n${historyText}\n\nNow, generate your next response. Keep it under 3 sentences. Stay in character!`;

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
          chatHistory.push({ role, text: fullResponse });

          if (fullResponse.includes('[AGREEMENT_REACHED]') || fullResponse.includes('[WALKAWAY]')) {
            matchStatus = 'finished';
          }
        } catch (e) {
          console.error("Gemini Error", e);
          sendEvent('chunk', { role, text: "[Connection to Agent Lost...]" });
          matchStatus = 'finished';
        }
      };

      const runCommentator = async () => {
        const historyText = chatHistory.slice(-2).map(m => `${m.role === 'agentA' ? agentA.name : agentB.name}: ${m.text}`).join('\n');
        const prompt = `Recent messages:\n${historyText}\n\nGive a quick, extremely dramatic play-by-play comment (1-2 sentences).`;

        const id = Math.random().toString(36).substring(7);
        sendEvent('start_turn', { role: 'commentator', id });

        try {
          const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
            config: {
              systemInstruction: generateCommentatorPrompt(),
              temperature: 0.8,
            }
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
          chatHistory.push({ role: 'commentator', text: fullResponse });
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

        const historyText = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
        const verdictPrompt = `The negotiation has ended. Here is the transcript:\n${historyText}\n\nGenerate a final verdict. State who won (or if it was a draw/agreement), the final terms (if any), and provide a savage one-line summary of how each agent performed. Keep it brief.`;
        
        const verdictRes = await ai.models.generateContent({
          model: model,
          contents: verdictPrompt,
        });

        sendEvent('verdict', { summary: verdictRes.text });
        
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
