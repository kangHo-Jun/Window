"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { classifyConsumer } from '@/lib/consumerGrouping';
import { getQuoteLevelLabel } from '@/lib/quoteLevelEngine';
import type { ExtractedChatFields } from '@/types/chat';
import type { AIQuoteData, QuoteLevel } from '@/types/quote';

type Props = {
  data: AIQuoteData;
  // props 우선, 없으면 data.data에서 읽음
  consultationNeeded?: boolean;
  fallbackCount?: number;
};

// AIQuoteData에서 분류에 필요한 필드 추출
function toExtractedFields(d: AIQuoteData['data']): ExtractedChatFields {
  return {
    customerName: '',
    housingType: d.housingType || '',
    pyeong: d.pyeong || '',
    expansion: d.expansion || '',
    space: d.space || '',
    count: '1개',
    age: d.age || '',
    problem: d.problem || '',
    timing: d.timing || '',
    floor: d.floor || '',
    corner: '',
    brandPreference: d.brandPreference || '',
    lifestyle: '',
    noiseSensitive: '',
    priority: d.priority || '',
  };
}

// 소비자 그룹 + 견적 레벨 기반 추천 전략
function getStrategy(
  group: string,
  quoteLevel: QuoteLevel,
  consultationNeeded: boolean,
): string {
  if (consultationNeeded) return '대화 난항 — 직접 전화 상담 즉시 필요';
  if (group === '긴급형') return '당일/익일 방문 상담 제안, 빠른 시공 일정 확인';
  if (group === '프리미엄형' && quoteLevel >= 2) return 'LX지인 프리미엄 라인 강조, 에너지 절감 효과 시연';
  if (group === '프리미엄형') return '추가 정보 수집 후 프리미엄 제안 — 방문 상담 유도';
  if (group === '가성비형') return 'KCC/기타 비교표 제시, 장기 A/S 조건 강조';
  if (group === '대규모형') return '현장 방문 견적 필수, 전체 패키지 할인 제안';
  if (group === '정보수집형') return '자료 발송 후 1주 내 후속 연락';
  if (quoteLevel >= 2) return '견적 완성도 높음 — 방문 상담 전환 시도';
  return '표준 상담 프로세스 진행';
}

// 우선순위 결정
function getPriority(
  group: string,
  quoteLevel: QuoteLevel,
  consultationNeeded: boolean,
): { label: string; color: string } {
  if (consultationNeeded || group === '긴급형' || group === '대규모형') {
    return { label: '상', color: 'text-red-600 bg-red-50 border-red-200' };
  }
  if ((group === '프리미엄형' && quoteLevel >= 2) || quoteLevel >= 2) {
    return { label: '중', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  }
  return { label: '하', color: 'text-slate-500 bg-slate-50 border-slate-200' };
}

export default function OperatorReport({ data, consultationNeeded, fallbackCount }: Props) {
  // props 우선, 없으면 data.data에 주입된 값 사용
  const isConsultationNeeded = consultationNeeded ?? data.data.consultationNeeded ?? false;
  const failCount = fallbackCount ?? data.data.fallbackCount ?? 0;
  const fields = toExtractedFields(data.data);
  const group = classifyConsumer(fields, failCount);
  const quoteLevel = data.data.quoteLevel;
  const strategy = getStrategy(group.group, quoteLevel, isConsultationNeeded);
  const priority = getPriority(group.group, quoteLevel, isConsultationNeeded);

  const infoItems = [
    { label: '주거형태', value: data.data.housingType },
    { label: '평형', value: data.data.pyeong },
    { label: '확장여부', value: data.data.expansion },
    { label: '교체공간', value: data.data.space },
    { label: '창호연식', value: data.data.age },
    { label: '불편사항', value: data.data.problem },
    { label: '시공시기', value: data.data.timing },
    { label: '층수', value: data.data.floor },
  ].filter(i => !!i.value);

  return (
    <Card className="rounded-2xl border border-indigo-200 bg-indigo-50/40 shadow-sm mt-4">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
          📋 상담사 전략 노트
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-3">
        {/* 소비자 그룹 + 견적 레벨 */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-100 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
            {group.emoji} {group.label}
          </span>
          <span className="rounded-full bg-white border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
            📊 {getQuoteLevelLabel(quoteLevel)}
          </span>
          {isConsultationNeeded && (
            <span className="rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 animate-pulse">
              ⚠️ 직접 상담 필요
            </span>
          )}
        </div>

        {/* 수집된 정보 요약 */}
        {infoItems.length > 0 && (
          <div className="rounded-xl bg-white border border-indigo-100 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            {infoItems.map(item => (
              <div key={item.label} className="flex gap-1">
                <span className="text-slate-400 shrink-0">{item.label}:</span>
                <span className="font-semibold text-slate-800 truncate">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* 추천 전략 */}
        <div className="rounded-xl bg-white border border-indigo-100 px-4 py-3">
          <p className="text-[10px] text-indigo-500 font-medium mb-1">💡 추천 상담 전략</p>
          <p className="text-xs font-semibold text-slate-800">{strategy}</p>
        </div>

        {/* 우선순위 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">우선순위</span>
          <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${priority.color}`}>
            {priority.label === '상' ? '🔴' : priority.label === '중' ? '🟡' : '🟢'} {priority.label}
          </span>
          {failCount > 0 && (
            <span className="text-[10px] text-slate-400">응답 실패 {failCount}회</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
