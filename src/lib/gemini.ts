import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelName = 'gemini-2.5-flash';

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
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const fullPrompt = history ? `${history}\n\n${prompt}` : prompt;
    const result = await model.generateContentStream(fullPrompt);
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }
    return fullText;
  } catch (e) {
    console.error("Gemini Streaming Error:", e);
    onChunk("[Streaming interrupted]");
    return "[Streaming interrupted]";
  }
};
