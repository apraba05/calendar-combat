import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelName = 'gemini-2.5-flash';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateJson = async (prompt: string): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: 'application/json', temperature: 0.7 } });
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || '{}');
  } catch (e) {
    console.error("Gemini JSON Generation Error:", e);
    return null;
  }
};

export const generateText = async (prompt: string, history: string = ''): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (e) {
    console.error("Gemini Text Generation Error:", e);
    return "The model refused to speak.";
  }
};

export const streamText = async (prompt: string, history: string = '', onChunk: (text: string) => void): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: modelName });
  const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContentStream(fullPrompt);
      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);
      }
      if (fullText.trim()) return fullText;
      throw new Error('Gemini stream returned empty text');
    } catch (e) {
      console.error(`Gemini Streaming Error (attempt ${attempt}/${maxAttempts}):`, e);
      if (attempt < maxAttempts) {
        await sleep(250 * attempt);
        continue;
      }
    }
  }

  // Final fallback: non-streaming call to avoid blank or noisy transcript entries.
  try {
    const fallback = await model.generateContent(fullPrompt);
    const text = fallback.response.text() || '';
    const normalized = text.trim() || 'Unable to continue the argument at this moment.';
    onChunk(normalized);
    return normalized;
  } catch (e) {
    console.error('Gemini Fallback Generation Error:', e);
    const graceful = 'Unable to continue the argument at this moment.';
    onChunk(graceful);
    return graceful;
  }
};
