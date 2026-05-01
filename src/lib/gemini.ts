import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const primaryModel = 'gemini-2.5-flash';
const fallbackModel = 'gemini-2.0-flash-lite';
const xaiBaseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
const xaiModel = process.env.XAI_MODEL || 'grok-4-fast-non-reasoning';
const XAI_MAX_OUTPUT_TOKENS = Number(process.env.XAI_MAX_OUTPUT_TOKENS || 220);
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

const extractJson = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced?.[1] || trimmed);
};

const generateXaiText = async (prompt: string, maxTokens = XAI_MAX_OUTPUT_TOKENS): Promise<string | null> => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`${xaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: xaiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`xAI request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content || '').trim() || null;
};

const streamXaiText = async (prompt: string, onChunk: (text: string) => void, maxTokens = XAI_MAX_OUTPUT_TOKENS): Promise<string | null> => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`${xaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: xaiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`xAI stream request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const token = parsed?.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            onChunk(token);
          }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText.trim() || null;
};

export const generateJson = async (prompt: string): Promise<any> => {
  await acquireGeminiSlot();
  try {
    const model = genAI.getGenerativeModel({ model: primaryModel, generationConfig: { responseMimeType: 'application/json', temperature: 0.7 } });
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || '{}');
  } catch (e) {
    console.error("Gemini JSON Generation Error:", e);
    try {
      const text = await generateXaiText(`${prompt}\n\nReturn only valid JSON. Do not wrap it in markdown.`, 900);
      return text ? extractJson(text) : null;
    } catch (xaiError) {
      console.error("xAI JSON Generation Error:", xaiError);
      return null;
    }
  } finally {
    releaseGeminiSlot();
  }
};

export const generateText = async (prompt: string, history: string = ''): Promise<string> => {
  await acquireGeminiSlot();
  const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
  try {
    const model = genAI.getGenerativeModel({ model: primaryModel });
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (e) {
    console.error("Gemini Text Generation Error:", e);
    try {
      return (await generateXaiText(fullPrompt)) || "The model refused to speak.";
    } catch (xaiError) {
      console.error("xAI Text Generation Error:", xaiError);
      return "The model refused to speak.";
    }
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
      try {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          onChunk(chunkText);
        }
        if (fullText.trim()) return fullText;
        throw new Error('Gemini stream returned empty text');
      } catch (streamErr: any) {
        if (fullText.trim().length > 0) {
          console.warn(`Gemini Streaming interrupted, returning ${fullText.length} partial chars.`, streamErr);
          return fullText;
        }
        throw streamErr;
      }
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
    const text = (fallback.response.text() || '').trim();
    if (text) {
      onChunk(text);
      return text;
    }
    throw new Error('Gemini non-streaming fallback returned empty text');
  } catch (e) {
    console.error('Gemini Fallback Generation Error:', e);
    try {
      const text = await streamXaiText(fullPrompt, onChunk);
      if (text) return text;
    } catch (xaiError) {
      console.error('xAI Fallback Generation Error:', xaiError);
    }
    return 'Unable to continue the argument at this moment.';
  } finally {
    releaseGeminiSlot();
  }
};
