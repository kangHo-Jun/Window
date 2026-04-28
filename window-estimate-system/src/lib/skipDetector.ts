import type { ExtractedChatFields, PendingSkip } from '@/types/chat';

export const SKIP_KEYWORDS = [
  '통과', '패스', 'pass', '건너뛰기',
  '다음', '몰라요', '모름', 'skip',
  '상관없어요', '아무거나', '그냥 넘어가요',
] as const;

export const CORE_FIELDS: Array<keyof ExtractedChatFields> = ['housingType', 'pyeong', 'expansion'];
export const SUB_FIELDS: Array<keyof ExtractedChatFields> = ['space', 'age', 'problem', 'timing'];

const CORE_DEFAULTS: Record<string, string> = {
  housingType: '아파트',
  pyeong: '30',
  expansion: '확장형',
};

export function isSkipIntent(message: string) {
  const normalized = message.replace(/\s+/g, '').toLowerCase();
  return SKIP_KEYWORDS.some((keyword) => normalized.includes(keyword.replace(/\s+/g, '').toLowerCase()));
}

export function isAffirmative(message: string) {
  const normalized = message.replace(/\s+/g, '').toLowerCase();
  return ['네', '좋아요', '예', '응', '맞아요', '좋습니다'].some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function isNegative(message: string) {
  const normalized = message.replace(/\s+/g, '').toLowerCase();
  return ['아니요', '직접', '아니', '말할게요'].some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function getSkipKind(field: keyof ExtractedChatFields): 'core' | 'sub' | null {
  if (CORE_FIELDS.includes(field)) return 'core';
  if (SUB_FIELDS.includes(field)) return 'sub';
  return null;
}

export function getCoreDefault(field: keyof ExtractedChatFields) {
  return CORE_DEFAULTS[field] || '';
}

export function createPendingSkip(field: keyof ExtractedChatFields): PendingSkip | null {
  const kind = getSkipKind(field);
  if (kind !== 'core') return null;

  const value = getCoreDefault(field);
  if (!value) return null;

  return {
    field,
    value,
    kind,
  };
}
