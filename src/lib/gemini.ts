import type { ChatMessage } from '../types/lumora';

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

export const streamGemini = async (
  apiKey: string,
  messages: ChatMessage[],
  signal: AbortSignal,
  onChunk: (text: string) => void,
) => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are Lumora, a concise, thoughtful assistant inside a calm new tab workspace. Use clear Markdown. Prefer practical answers and avoid unnecessary filler.' }],
        },
        contents: messages
          .filter((message) => message.content.trim() && !message.pending && !message.error)
          .map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as GeminiStreamChunk | null;
    throw new Error(payload?.error?.message || `Gemini request failed (${response.status}).`);
  }
  if (!response.body) throw new Error('Gemini returned an empty response.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      const chunk = JSON.parse(payload) as GeminiStreamChunk;
      if (chunk.error?.message) throw new Error(chunk.error.message);
      const text = chunk.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
      if (text) onChunk(text);
    }
  }
};
