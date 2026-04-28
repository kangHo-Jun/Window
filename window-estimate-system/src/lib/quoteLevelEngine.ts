import type { ExtractedChatFields, SkipFieldMap } from '@/types/chat';
import type { QuoteLevel } from '@/types/quote';
import { CORE_FIELDS, SUB_FIELDS } from './skipDetector';

export const LEVEL1_KEYS: Array<keyof ExtractedChatFields> = ['housingType', 'pyeong', 'expansion', 'space'];
export const LEVEL2_KEYS: Array<keyof ExtractedChatFields> = [...LEVEL1_KEYS, 'age', 'problem'];
export const LEVEL3_KEYS: Array<keyof ExtractedChatFields> = [...LEVEL2_KEYS, 'timing', 'floor', 'brandPreference', 'priority'];

export const PROGRESS_KEYS: Array<keyof ExtractedChatFields> = LEVEL3_KEYS;

function isFilled(value: string) {
  return !!value && value !== 'null' && value !== '';
}

function hasAll(fields: ExtractedChatFields, keys: Array<keyof ExtractedChatFields>) {
  return keys.every((key) => isFilled(fields[key]));
}

export function getCollectedProgressCount(fields: ExtractedChatFields) {
  return PROGRESS_KEYS.filter((key) => isFilled(fields[key])).length;
}

export function getQuoteLevel(fields: ExtractedChatFields): QuoteLevel {
  if (hasAll(fields, LEVEL3_KEYS)) return 3;
  if (hasAll(fields, LEVEL2_KEYS)) return 2;
  if (hasAll(fields, LEVEL1_KEYS)) return 1;
  return 0;
}

export function getQuoteErrorPercent(level: QuoteLevel, skippedFields?: SkipFieldMap) {
  const base = level === 3 ? 5 : level === 2 ? 15 : level === 1 ? 30 : 0;
  const skipEntries = Object.entries(skippedFields || {}) as Array<[keyof ExtractedChatFields, boolean]>;
  const extra = skipEntries.reduce((sum, [key, active]) => {
    if (!active) return sum;
    if (CORE_FIELDS.includes(key)) return sum + 10;
    if (SUB_FIELDS.includes(key)) return sum + 5;
    return sum;
  }, 0);

  return base + extra;
}

export function getQuoteErrorLabel(level: QuoteLevel, skippedFields?: SkipFieldMap) {
  const percent = getQuoteErrorPercent(level, skippedFields);
  return percent > 0 ? `±${percent}%` : '';
}

export function getQuoteLevelLabel(level: QuoteLevel) {
  if (level === 3) return '정밀 가견적';
  if (level === 2) return '가견적';
  if (level === 1) return '빠른 가견적';
  return '견적 준비중';
}

export function getQuoteLevelButtonLabel(level: QuoteLevel, skippedFields?: SkipFieldMap) {
  const errorLabel = getQuoteErrorLabel(level, skippedFields);
  if (level === 3) return `🎯 정밀 가견적 ${errorLabel}`;
  if (level === 2) return `📋 가견적 ${errorLabel}`;
  if (level === 1) return `⚡ 빠른 가견적 ${errorLabel}`;
  return '';
}
