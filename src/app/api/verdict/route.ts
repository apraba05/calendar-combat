import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateVerdictPrompt } from '@/lib/prompts';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { fightId } = await req.json();
  const store = getStore();
  const fightData = store.get(fightId);

  if (!fightData) {
    return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
  }

  if (fightData.verdictData) {
    return NextResponse.json(fightData.verdictData);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-2.5-flash';

  const transcript = fightData.messages.map(m => `${m.role}: ${m.text}`).join('\n');
  const prompt = generateVerdictPrompt(transcript);

  try {
    const res = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const verdictJson = JSON.parse(res.text || '{}');
    
    fightData.verdictData = verdictJson;
    store.set(fightId, fightData);

    return NextResponse.json(verdictJson);
  } catch (e) {
    console.error("Verdict generation failed", e);
    return NextResponse.json({ error: 'Failed to generate verdict' }, { status: 500 });
  }
}
