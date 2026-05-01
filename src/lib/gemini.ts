import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const primaryModel = 'gemini-2.5-flash';
const fallbackModel = 'gemini-2.0-flash-lite';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_GEMINI_CONCURRENCY = Number(process.env.MAX_GEMINI_CONCURRENCY || 1);
const GEMINI_MIN_REQUEST_GAP_MS = Number(process.env.GEMINI_MIN_REQUEST_GAP_MS || 700);
let activeGeminiCalls = 0;
let lastGeminiStartAt = 0;
const geminiWaiters: Array<() => void> = [];

const acquireGeminiSlot = async () => {
  if (activeGeminiCalls >= MAX_GEMINI_CONCURRENCY) {
    await new Promise<void>((resolve) => geminiWaiters.push(resolve));
  }
  activeGeminiCalls += 1;
  const now = Date.now();
  const waitMs = Math.max(0, GEMINI_MIN_REQUEST_GAP_MS - (now - lastGeminiStartAt));
  if (waitMs > 0) await sleep(waitMs);
  lastGeminiStartAt = Date.now();
};

const releaseGeminiSlot = () => {
  activeGeminiCalls = Math.max(0, activeGeminiCalls - 1);
  const next = geminiWaiters.shift();
  if (next) next();
};

const isRateLimitError = (err: any) => {
  const msg = String(err?.message || '').toLowerCase();
  const status = err?.status || err?.response?.status;
  return status === 429 || msg.includes('429') || msg.includes('rate') || msg.includes('quota');
};

export const generateJson = async (prompt: string): Promise<any> => {
  await acquireGeminiSlot();
  try {
    const model = genAI.getGenerativeModel({ model: primaryModel, generationConfig: { responseMimeType: 'application/json', temperature: 0.7 } });
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || '{}');
  } catch (e) {
    console.error("Gemini JSON Generation Error:", e);
    return null;
  } finally {
    releaseGeminiSlot();
  }
};

export const generateText = async (prompt: string, history: string = ''): Promise<string> => {
  await acquireGeminiSlot();
  try {
    const model = genAI.getGenerativeModel({ model: primaryModel });
    const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (e) {
    console.error("Gemini Text Generation Error:", e);
    return "The model refused to speak.";
  } finally {
    releaseGeminiSlot();
  }
};

export const streamText = async (prompt: string, history: string = '', onChunk: (text: string) => void): Promise<string> => {
  await acquireGeminiSlot();
  const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
  const maxAttempts = 4;
  let usingFallbackModel = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: usingFallbackModel ? fallbackModel : primaryModel });
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
      const limited = isRateLimitError(e);
      console.error(`Gemini Streaming Error (attempt ${attempt}/${maxAttempts}, model=${usingFallbackModel ? fallbackModel : primaryModel}, rate_limited=${limited}):`, e);
      if (limited && !usingFallbackModel) {
        usingFallbackModel = true;
      }
      if (attempt < maxAttempts) {
        // Back off more aggressively on quota/rate-limit errors.
        await sleep((limited ? 1200 : 300) * attempt);
        continue;
      }
    }
  }

  // Final fallback: non-streaming call to avoid blank or noisy transcript entries.
  try {
    const model = genAI.getGenerativeModel({ model: usingFallbackModel ? fallbackModel : primaryModel });
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
  } finally {
    releaseGeminiSlot();
  }
};
