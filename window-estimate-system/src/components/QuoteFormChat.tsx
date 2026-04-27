"use client";

import AIChatBot from '@/components/AIChatBot';
import type { QuoteCompleteHandler } from '@/types/quote';

/**
 * ver20에서는 기존 3문항 폼 대신 RAG AI 챗봇을 사용
 */
export default function QuoteFormChat({ onComplete }: { onComplete: QuoteCompleteHandler }) {
  return <AIChatBot onComplete={onComplete} />;
}
