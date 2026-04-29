"use client";

import React from 'react';
import BrandCompareTable from './BrandCompareTable';
import SavingsCalculator from './SavingsCalculator';
import ConsultingReport from './ConsultingReport';
import OperatorReport from './OperatorReport';
import PDFDownload from './PDFDownload';
import ConsultationForm from './ConsultationForm';
import ConsultationSuccess from './ConsultationSuccess';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAIQuoteData, type QuoteData, type QuoteLevel } from '@/types/quote';

export default function QuoteResult({
  data,
  onReset,
  quoteLevel,
  consultationNeeded,
  fallbackCount,
}: {
  data: QuoteData | null;
  onReset: () => void;
  quoteLevel?: QuoteLevel;
  consultationNeeded?: boolean;
  fallbackCount?: number;
}) {
  const [showForm, setShowForm] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  if (!data) return null;

  if (isSuccess) {
    return <ConsultationSuccess onReset={onReset} />;
  }

  const resolvedLevel = quoteLevel ?? (isAIQuoteData(data) ? data.data.quoteLevel : 0);
  const errorRange = isAIQuoteData(data) ? data.data.errorRange : '';
  const comparison = isAIQuoteData(data) ? data.data.comparison : [];
  const minPrice = comparison.length > 0 ? Math.min(...comparison.map((item) => item.finalTotal)) : 0;
  const maxPrice = comparison.length > 0 ? Math.max(...comparison.map((item) => item.finalTotal)) : 0;
  const summaryTitle = resolvedLevel === 3 ? '정밀 가견적' : resolvedLevel === 2 ? '가견적' : '빠른 가견적';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto">
      <div className="text-center mb-10 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {summaryTitle}이 준비되었습니다
        </h2>
        <p className="text-slate-500 mt-2">
          현재 수집된 정보 기준 결과이며 예상 오차 범위는 {errorRange || '±30%'}입니다.
        </p>
      </div>

      {resolvedLevel === 1 && isAIQuoteData(data) && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg text-amber-900">빠른 가견적 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-xl bg-white px-4 py-4">
                <p className="text-slate-500">3사 가격 범위</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {minPrice.toLocaleString()}원 ~ {maxPrice.toLocaleString()}원
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {comparison.map((item) => (
                  <div key={item.brand} className="rounded-xl border bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">{item.brand}</p>
                    <p className="mt-1 font-bold text-slate-900">{item.finalTotal.toLocaleString()}원</p>
                  </div>
                ))}
              </div>
              <p className="font-medium text-amber-900">예상 오차 범위 {data.data.errorRange} 기준의 빠른 참고 견적입니다.</p>
              <p className="text-slate-700">추천 브랜드는 {data.data.recommendedBrand}입니다. {data.data.recommendedReason || '현재 조건에서 성능과 장기 효율 기준으로 가장 안정적입니다.'}</p>
              {data.data.heatingSavingText && (
                <p className="text-emerald-700 font-medium">{data.data.heatingSavingText}</p>
              )}
            </CardContent>
          </Card>
          {/* 운영자 전략 카드 — 레벨 1에서도 표시 */}
          <OperatorReport
            data={data}
            consultationNeeded={consultationNeeded}
            fallbackCount={fallbackCount}
          />
        </div>
      )}

      {resolvedLevel >= 2 && (
        <div className="space-y-8">
          <BrandCompareTable quoteData={data} />
          {isAIQuoteData(data) && (
            <Card className="rounded-2xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg">공간별 창호 구성 요약</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <p className="text-slate-500">주요 교체 조건</p>
                  <p className="mt-2 font-semibold text-slate-900">{data.data.housingType} · {data.data.pyeong}평 · {data.data.expansion}</p>
                  <p className="mt-1">{data.data.space || '미정'} 공간 기준</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <p className="text-slate-500">고객 상황 진단</p>
                  <p className="mt-2 font-semibold text-slate-900">노후도: {data.data.age || '미정'}</p>
                  <p className="mt-1">주요 고민: {data.data.problem || '미정'}</p>
                  <p className="mt-1">추천 이유: {data.data.recommendedReason || '현재 조건 기준 성능 균형 우수'}</p>
                  <p className="mt-1 text-blue-700">예상 오차 범위 {data.data.errorRange}</p>
                  {data.data.heatingSavingText && (
                    <p className="mt-1 text-emerald-700">{data.data.heatingSavingText}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <SavingsCalculator quoteData={data} />
          {resolvedLevel >= 3 && <ConsultingReport quoteData={data} />}
          {/* 운영자 전략 카드 — 레벨 2 이상 AI 견적에서 표시 */}
          {isAIQuoteData(data) && (
            <OperatorReport
              data={data}
              consultationNeeded={consultationNeeded}
              fallbackCount={fallbackCount}
            />
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-8 border-t border-slate-200 mt-8">
        <Button variant="outline" size="lg" onClick={onReset} className="w-full sm:w-auto px-8 h-[72px] rounded-xl font-medium text-slate-600">
          다시 견적내기
        </Button>
        {resolvedLevel >= 3 && (
          <div className="w-full sm:w-80">
            <PDFDownload quoteData={data} />
          </div>
        )}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger render={<Button size="lg" className="w-full sm:w-auto px-10 h-[72px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg" />}>
              전문가 방문 상담 신청
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <ConsultationForm 
              quoteData={data} 
              onSuccess={() => {
                setShowForm(false);
                setIsSuccess(true);
              }}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
