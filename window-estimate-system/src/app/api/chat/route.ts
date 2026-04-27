import { NextResponse } from 'next/server';
import {
  buildFallbackReply,
  buildQuoteData,
  buildRagPrompt,
  GEMINI_MODEL,
  getRagContext,
  shouldShowResult,
} from '@/lib/ragEngine';
import type { ChatApiResponse, ChatRequest } from '@/types/chat';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function generateGeminiReply(prompt: string, apiKey: string) {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status}`);
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

/**
 * RAG 기반 창호 챗봇 API
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const trimmedHistory = (body.history || []).slice(-5);
    const bundle = await getRagContext(body.message, trimmedHistory);
    const showResult = shouldShowResult(bundle.fields);
    const quoteData = showResult ? buildQuoteData(bundle) : null;
    const prompt = buildRagPrompt(bundle, trimmedHistory, showResult);
    const apiKey = process.env.GEMINI_API_KEY;

    let reply = buildFallbackReply(bundle, showResult);

    if (apiKey) {
      try {
        const geminiReply = await generateGeminiReply(prompt, apiKey);
        if (geminiReply) {
          reply = geminiReply;
        }
      } catch (error) {
        console.error('Gemini 호출 실패, fallback 응답 사용:', error);
      }
    }

    const response: ChatApiResponse = {
      reply,
      quoteData,
      showResult,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const message = error instanceof Error ? error.message : '채팅 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
