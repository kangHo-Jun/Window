"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ExtractedChatFields, SkipFieldMap } from '@/types/chat';
import { getCollectedProgressCount, getQuoteLevel, PROGRESS_KEYS } from '@/lib/quoteLevelEngine';

interface ChatProgressProps {
  fields: ExtractedChatFields;
  skippedFields?: SkipFieldMap;
}

const FIELD_LABELS: Record<keyof ExtractedChatFields, string> = {
  customerName: '이름',
  housingType: '주거형태',
  pyeong: '평형',
  expansion: '확장여부',
  spaces: '공간',
  spaceSizes: '공간크기',
  count: '창개수',
  age: '노후도',
  problem: '불편사항',
  problems: '불편사항목록',
  diagnosisStep: '진단단계',
  diagnosisDetail: '진단세부',
  timing: '시공시기',
  floor: '층수',
  corner: '특이구조',
  brandPreference: '브랜드',
  lifestyle: '생활패턴',
  noiseSensitive: '소음민감도',
  priority: '우선순위',
};

export default function ChatProgress({ fields, skippedFields = {} }: ChatProgressProps) {
  const collectedCount = getCollectedProgressCount(fields);
  const totalCount = PROGRESS_KEYS.length;
  const progressValue = (collectedCount / totalCount) * 100;
  const quoteLevel = getQuoteLevel(fields);
  const milestones = [
    { value: 3, label: 'L1', active: quoteLevel >= 1 },
    { value: 6, label: 'L2', active: quoteLevel >= 2 },
    { value: 10, label: 'L3', active: quoteLevel >= 3 },
  ];

  return (
    <div className="px-5 py-3 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10 transition-all duration-300">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-blue-600 flex items-center">
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
          상담 진행도 ({collectedCount}/{totalCount})
        </span>
        <span className="text-xs font-medium text-slate-400">
          레벨 {quoteLevel} · {Math.round(progressValue)}% 완료
        </span>
      </div>
      <div className="relative">
        <Progress value={progressValue} className="h-1.5 bg-slate-100" />
        {milestones.map((milestone) => (
          <div
            key={milestone.label}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${(milestone.value / totalCount) * 100}%` }}
          >
            <div className={`h-3 w-3 rounded-full border-2 ${milestone.active ? 'border-amber-400 bg-amber-400' : 'border-slate-300 bg-white'}`} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-400">
        <span className={quoteLevel >= 1 ? 'text-amber-600' : ''}>레벨1 3/10</span>
        <span className={quoteLevel >= 2 ? 'text-amber-600' : ''}>레벨2 6/10</span>
        <span className={quoteLevel >= 3 ? 'text-amber-600' : ''}>레벨3 10/10</span>
      </div>
      
      <div className="flex flex-wrap gap-1 mt-2 overflow-x-auto no-scrollbar">
        {PROGRESS_KEYS.map((key) => {
          const value = fields[key];
          const isCollected = Array.isArray(value)
            ? value.length > 0
            : typeof value === 'object' && value !== null
              ? Object.keys(value).length > 0
              : !!value;
          const isSkipped = !!skippedFields[key];
          return (
            <div 
              key={key}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-300 ${
                isSkipped
                  ? 'border-slate-300 border-dashed bg-slate-50 text-slate-500'
                  : isCollected 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-slate-50 border-slate-100 text-slate-300'
              }`}
            >
              {FIELD_LABELS[key]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
