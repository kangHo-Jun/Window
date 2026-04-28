import type { ChatMessage, SentimentType } from '@/types/chat';

export type SentimentResult = {
  type: SentimentType;
  instruction: string;
};

const SENTIMENT_RULES: Record<SentimentType, { keywords: string[]; instruction: string }> = {
  FRUSTRATED: {
    keywords: ['짜증', '모르겠다', '왜 이래', '답답', '화나', '귀찮'],
    instruction: '더 부드럽고 공감하는 말투를 사용하고, 복잡한 질문을 피하고 아주 짧게 안내해라.',
  },
  CONFUSED: {
    keywords: ['뭔말', '무슨', '이해못', '헷갈', '어렵'],
    instruction: '설명을 아주 쉽게 풀어서 말하고, 용어 대신 쉬운 예시를 들어라.',
  },
  IMPATIENT: {
    keywords: ['빨리', '그냥', '바로', '대충', '즉시'],
    instruction: '질문 수를 줄이고 빠르게 핵심만 안내해라. 견적 버튼을 활용할 수 있게 짧게 응답해라.',
  },
  SATISFIED: {
    keywords: ['좋아요', '감사', '도움됐', '괜찮', '좋네'],
    instruction: '긍정적인 톤을 유지하되 과한 설명은 피하고, 필요한 경우에만 다음 정보를 자연스럽게 받아라.',
  },
  NEUTRAL: {
    keywords: [],
    instruction: '기본 지인이 말투를 유지해라.',
  },
};

export function detectSentiment(message: string, history: ChatMessage[]): SentimentResult {
  const normalized = message.replace(/\s+/g, '').toLowerCase();
  const lastUserMessage = [...history].reverse().find((entry) => entry.role === 'user')?.content.replace(/\s+/g, '').toLowerCase() || '';

  if (lastUserMessage && lastUserMessage === normalized) {
    return {
      type: 'FRUSTRATED',
      instruction: SENTIMENT_RULES.FRUSTRATED.instruction,
    };
  }

  for (const sentiment of ['FRUSTRATED', 'CONFUSED', 'IMPATIENT', 'SATISFIED'] as const) {
    const matched = SENTIMENT_RULES[sentiment].keywords.some((keyword) => normalized.includes(keyword));
    if (matched) {
      return {
        type: sentiment,
        instruction: SENTIMENT_RULES[sentiment].instruction,
      };
    }
  }

  return {
    type: 'NEUTRAL',
    instruction: SENTIMENT_RULES.NEUTRAL.instruction,
  };
}
