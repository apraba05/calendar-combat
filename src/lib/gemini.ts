import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

export const generateJson = async (prompt: string): Promise<any> => {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });
    return JSON.parse(res.text || '{}');
  } catch (e) {
    console.error("Gemini JSON Generation Error:", e);
    return null;
  }
};

export const generateText = async (prompt: string, history: string = ''): Promise<string> => {
  try {
    const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
    const res = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: { temperature: 0.8 }
    });
    return res.text || '';
  } catch (e) {
    console.error("Gemini Text Generation Error:", e);
    return '';
  }
};

// Stream helper for when we need to push chunks to Pusher
export const streamText = async (prompt: string, history: string = '', onChunk: (chunk: string) => void): Promise<string> => {
  try {
    const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
    const stream = await ai.models.generateContentStream({
      model,
      contents: fullPrompt,
      config: { temperature: 0.8 }
    });
    
    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(chunk.text);
      }
    }
    return fullText;
  } catch (e) {
    console.error("Gemini Stream Error:", e);
    return '';
  }
}
