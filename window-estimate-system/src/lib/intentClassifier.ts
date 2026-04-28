/**
 * 소비자 태도(Intent/Attitude) 분류 엔진
 * 사용자의 발화에서 키워드와 맥락을 분석하여 5가지 유형으로 분류
 */

export type UserAttitude = 'EAGER' | 'HESITANT' | 'CONFUSED' | 'PRICE_SENSITIVE' | 'QUALITY_FOCUSED' | 'NEUTRAL';

export interface IntentResult {
  attitude: UserAttitude;
  strategy: string;
  detectedKeywords: string[];
}

const ATTITUDE_MAP: Record<UserAttitude, { keywords: string[], strategy: string }> = {
  EAGER: {
    keywords: ["빨리", "바로", "지금", "당장", "견적", "얼마나요", "방문", "실측"],
    strategy: "불필요한 설명은 줄이고 빠르게 견적 카드 또는 실측 상담으로 유도"
  },
  HESITANT: {
    keywords: ["그냥", "궁금", "아직", "고민", "나중에", "생각좀", "둘러보는"],
    strategy: "부담을 주지 않고 유용한 정보(에너지 절감 등)를 먼저 제공하여 신뢰 구축"
  },
  CONFUSED: {
    keywords: ["모르겠", "어떤게", "뭐가", "차이", "어렵네요", "추천", "가이드"],
    strategy: "쉬운 용어로 설명하고, 역질문을 통해 고객의 상황에 맞는 제품을 전문가답게 가이드"
  },
  PRICE_SENSITIVE: {
    keywords: ["비싸", "저렴", "예산", "얼마", "할인", "최저가", "싼", "가성비"],
    strategy: "3사 가격 비교와 에너지 절감액(난방비 감소)을 강조하여 비용 효율성 부각"
  },
  QUALITY_FOCUSED: {
    keywords: ["좋은", "최고", "1등급", "단열", "소음", "결로", "오래", "품질"],
    strategy: "LX지인 1등급 창호의 프리미엄 성능과 본사 보증의 가치를 집중 강조"
  },
  NEUTRAL: {
    keywords: [],
    strategy: "기본 페르소나를 유지하며 자연스럽게 대화 유도"
  }
};

/**
 * 사용자 메시지 분석하여 태도 분류
 */
export function classifyIntent(message: string): IntentResult {
  const normalizedMessage = message.replace(/\s+/g, '').toLowerCase();
  let bestMatch: UserAttitude = 'NEUTRAL';
  let maxWeight = 0;
  let matches: string[] = [];

  for (const [attitude, data] of Object.entries(ATTITUDE_MAP)) {
    const found = data.keywords.filter(kw => normalizedMessage.includes(kw));
    if (found.length > maxWeight) {
      maxWeight = found.length;
      bestMatch = attitude as UserAttitude;
      matches = found;
    }
  }

  return {
    attitude: bestMatch,
    strategy: ATTITUDE_MAP[bestMatch].strategy,
    detectedKeywords: matches
  };
}

/**
 * 태도에 따른 시스템 추가 지침 반환
 */
export function getAttitudeInstruction(attitude: UserAttitude): string {
  if (attitude === 'NEUTRAL') return "";
  
  return `
[현재 고객 태도: ${attitude}]
전략: ${ATTITUDE_MAP[attitude].strategy}
이 전략에 맞춰 답변의 우선순위와 말투를 조절해줘.
`;
}
