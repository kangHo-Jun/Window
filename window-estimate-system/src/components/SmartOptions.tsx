"use client";

import React from 'react';
import type { ExtractedChatFields } from '@/types/chat';

interface SmartOptionsProps {
  currentQuestionField: keyof ExtractedChatFields | null;
  onSelect: (option: string) => void;
  loading: boolean;
  emphasize?: boolean;
  suggestedReplies?: string[];
}

const OPTION_MAP: Record<string, string[]> = {
  housingType: ['아파트', '빌라', '단독주택'],
  pyeong: ['20평대', '30평대', '40평대', '50평대+'],
  expansion: ['확장형', '비확장형', '부분확장'],
  space: ['거실', '안방', '전체', '발코니'],
  age: ['10년 이하', '10~20년', '20년 이상'],
  problem: ['단열/추위', '소음 차단', '결로/곰팡이', '노후/미관'],
  timing: ['즉시', '1~3개월', '6개월 이후', '미정'],
};

// 화면 표시용 레이블 (전송값과 별도 — API 허용값 변경 없음)
const DISPLAY_LABEL: Record<string, Record<string, string>> = {
  housingType: {
    '아파트': '🏢 아파트',
    '빌라': '🏘 빌라/연립',
    '단독주택': '🏠 단독주택',
  },
};

export default function SmartOptions({
  currentQuestionField,
  onSelect,
  loading,
  emphasize = false,
  suggestedReplies = [],
}: SmartOptionsProps) {
  const options = currentQuestionField ? (OPTION_MAP[currentQuestionField] ?? []) : [];
  const mergedOptions = Array.from(new Set([...suggestedReplies, ...options]));

  if (mergedOptions.length === 0) return null;
  if (loading && suggestedReplies.length === 0) return null;

  const fieldKey = currentQuestionField ?? '';

  return (
    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {mergedOptions.map((option) => {
        // 표시 레이블: 이모지 포함 레이블 있으면 사용, 없으면 원본값
        const label = DISPLAY_LABEL[fieldKey]?.[option] ?? option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 ${
              emphasize
                ? 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 ring-2 ring-amber-200'
                : 'bg-white border border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
