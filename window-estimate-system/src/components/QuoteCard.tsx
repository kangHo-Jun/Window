"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuoteLevelLabel } from '@/lib/quoteLevelEngine';
import type { ConsumerGroupInfo, SkipFieldMap } from '@/types/chat';
import type { AIQuoteData } from '@/types/quote';

type Props = {
  data: AIQuoteData;
  consumerGroup?: ConsumerGroupInfo;
  skippedFields?: SkipFieldMap;
  onViewFull?: () => void;
  onCallConsult?: () => void;
};

export default function QuoteCard({ data, consumerGroup, onViewFull, onCallConsult }: Props) {
  const { quoteLevel, comparison, recommendedBrand, errorRange, recommendedReason, heatingSavingText } = data.data;
  const levelLabel = getQuoteLevelLabel(quoteLevel);
  const minPrice = comparison.length > 0 ? Math.min(...comparison.map((i) => i.finalTotal)) : 0;
  const maxPrice = comparison.length > 0 ? Math.max(...comparison.map((i) => i.finalTotal)) : 0;

  const levelIcon = quoteLevel === 1 ? '⚡' : quoteLevel === 2 ? '📋' : '🎯';
  const borderColor =
    quoteLevel === 3 ? 'border-emerald-300 bg-emerald-50/50' :
    quoteLevel === 2 ? 'border-blue-300 bg-blue-50/50' :
    'border-amber-300 bg-amber-50/50';
  const titleColor =
    quoteLevel === 3 ? 'text-emerald-900' :
    quoteLevel === 2 ? 'text-blue-900' :
    'text-amber-900';
  const badgeColor =
    quoteLevel === 3 ? 'text-emerald-700 bg-emerald-100' :
    quoteLevel === 2 ? 'text-blue-700 bg-blue-100' :
    'text-amber-700 bg-amber-100';
  const recommendBtnColor =
    quoteLevel === 3 ? 'bg-emerald-600 hover:bg-emerald-700' :
    quoteLevel === 2 ? 'bg-blue-600 hover:bg-blue-700' :
    'bg-amber-500 hover:bg-amber-600';
  const outlineBtnColor =
    quoteLevel === 3 ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' :
    quoteLevel === 2 ? 'border-blue-300 text-blue-700 hover:bg-blue-50' :
    'border-amber-300 text-amber-700 hover:bg-amber-50';

  return (
    <Card className={`rounded-2xl border shadow-md my-2 ${borderColor}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-bold flex items-center gap-1 ${titleColor}`}>
            {levelIcon} {levelLabel}
          </CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{errorRange}</span>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* 3사 가격 비교 */}
        <div className="grid grid-cols-3 gap-2">
          {comparison.map((item) => (
            <div
              key={item.brand}
              className={`rounded-xl px-2 py-2.5 text-center transition-all ${
                item.brand === recommendedBrand
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              <p className="text-[10px] font-medium truncate">{item.brand}</p>
              <p className="text-xs font-bold mt-0.5">{Math.round(item.finalTotal / 10000)}만원</p>
              {item.brand === recommendedBrand && (
                <>
                  <p className="text-[9px] mt-0.5 opacity-80">⭐ 추천</p>
                  {item.productName && <p className="mt-1 text-[9px] leading-relaxed opacity-90">{item.productName}</p>}
                  <p className="mt-1 text-[9px] leading-relaxed opacity-90">{item.recommendReason || recommendedReason}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 가격 범위 */}
        <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
          <p className="text-[10px] text-slate-400">예상 총 범위</p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">
            {Math.round(minPrice / 10000)}만 ~ {Math.round(maxPrice / 10000)}만원
          </p>
        </div>

        {(recommendedReason || heatingSavingText) && (
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 text-[11px] text-slate-600 space-y-1">
            {recommendedReason && <p>추천 이유: <span className="font-semibold text-slate-800">{recommendedReason}</span></p>}
            {heatingSavingText && <p>난방비 절감: <span className="font-semibold text-emerald-700">{heatingSavingText}</span></p>}
          </div>
        )}

        {/* 레벨 2+ 공간·상태 정보 */}
        {quoteLevel >= 2 && (
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 text-[11px] text-slate-600 space-y-0.5">
            <p>공간: <span className="font-semibold text-slate-800">{data.data.space || '전체'}</span> · 연식: <span className="font-semibold text-slate-800">{data.data.age || '미정'}</span></p>
            <p>주요 고민: <span className="font-semibold text-slate-800">{data.data.problem || '미정'}</span></p>
          </div>
        )}

        {/* 레벨 3 상세 정보 */}
        {quoteLevel >= 3 && (
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 text-[11px] text-slate-600 space-y-0.5">
            <p>시공 시기: <span className="font-semibold text-slate-800">{data.data.timing || '미정'}</span> · 층수: <span className="font-semibold text-slate-800">{data.data.floor || '미정'}</span></p>
            <p>브랜드 선호: <span className="font-semibold text-slate-800">{data.data.brandPreference || '미정'}</span></p>
          </div>
        )}

        {/* 소비자 그룹 (UNKNOWN 제외) */}
        {consumerGroup && consumerGroup.group !== 'UNKNOWN' && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-700 flex items-center gap-1.5">
            <span className="font-semibold">{consumerGroup.emoji} {consumerGroup.label}</span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-500">{consumerGroup.hint} 원하시는 분</span>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-1">
          {onViewFull && (
            <button
              type="button"
              onClick={onViewFull}
              className={`flex-1 rounded-xl border bg-white px-3 py-2 text-xs font-bold transition-colors ${outlineBtnColor}`}
            >
              상세 견적 보기
            </button>
          )}
          {onCallConsult && (
            <button
              type="button"
              onClick={onCallConsult}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors ${recommendBtnColor}`}
            >
              전문가 상담 신청
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
