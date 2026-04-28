"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { isAIQuoteData, isLegoQuoteData, type QuoteData } from '@/types/quote';

export default function ConsultingReport({ quoteData }: { quoteData: QuoteData }) {
  return (
    <Card className="border border-slate-200 shadow-md bg-white overflow-hidden rounded-2xl w-full mt-8">
      <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
        <CardTitle className="text-xl flex items-center text-blue-900">
          <span className="mr-2">📝</span> AI 스마트 컨설팅 레포트
        </CardTitle>
        <p className="text-sm text-blue-700 opacity-80 mt-1">
          입력하신 정보와 3사 견적 빅데이터를 기반으로 생성된 요약 보고서입니다.
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8">
        {/* 입력 요약 */}
        <div className="space-y-4">
           <h3 className="text-base font-bold text-slate-800 border-b pb-2">1. 고객 맞춤 폼 입력 요약</h3>
           <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block font-semibold text-slate-400 mb-1">견적 산출 방식</span>
                <span className="font-medium text-slate-800">
                  {isLegoQuoteData(quoteData) ? '스마트 레고식 (상세 선택)' : isAIQuoteData(quoteData) ? 'RAG AI 챗봇식' : '대화형 챗봇식 (간편 입력)'}
                </span>
              </div>
              <div>
                <span className="block font-semibold text-slate-400 mb-1">입력된 공간 상태</span>
                <span className="font-medium text-slate-800">
                  {isLegoQuoteData(quoteData)
                    ? `${quoteData.data.housingType || '아파트'} | ${quoteData.data.pyeong || '30'}평대 | ${quoteData.data.expansion || '비확장형'}`
                    : isAIQuoteData(quoteData)
                      ? `${quoteData.data.housingType} | ${quoteData.data.pyeong}평 | ${quoteData.data.space} | ${quoteData.data.expansion} | 노후도: ${quoteData.data.age} | 시공: ${quoteData.data.timing}`
                      : `공간: ${quoteData.data.space || '-'} / 창 갯수: ${quoteData.data.count || '-'}`
                  }
                </span>
              </div>
              {isAIQuoteData(quoteData) && (
                <div className="sm:col-span-2">
                  <span className="block font-semibold text-slate-400 mb-1">고민 사항</span>
                  <span className="font-medium text-slate-800">{quoteData.data.problem || '입력 없음'}</span>
                </div>
              )}
           </div>
        </div>

        {/* AI 추천 의견 */}
        <div className="space-y-4">
           <h3 className="text-base font-bold text-slate-800 border-b pb-2">2. 전문가 통합 추천 의견</h3>
           <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 relative">
             <div className="absolute top-4 right-4 text-blue-200">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
             </div>
             <p className="text-sm font-bold text-blue-900 mb-2">선정 브랜드: LX지인 프리미엄 라인</p>
             <p className="text-sm text-slate-600 leading-relaxed">
               현재 고객님이 입력하신 정보를 고려할 때, <span className="font-semibold text-blue-600">장기적인 단열 성능 저하 방지와 난방비 절감 효율</span>을 위해 1등급 창호인 LX지인 제품을 최우선으로 추천해 드립니다.<br/><br/>
               보급형 창호(기타 브랜드) 대비 초기 시공비는 높지만, 누적 10년 기준 에너지 세이브 비용을 감안하면 전체적인 내구연한 동안 더 큰 효용을 제공합니다.
             </p>
           </div>
        </div>

        {/* 마무리 안내 */}
        <div className="bg-slate-50 text-slate-500 text-xs p-4 rounded-lg text-center leading-relaxed">
           본 종합 레포트는 단순 참고 및 개략적인 예산 편성을 위한 용도입니다.<br/>
           정확한 가격은 현장 실측, 층수, 사다리차 진입 여부에 따라 크게 달라질 수 있으므로 반드시 방문 실측을 요청하시기 바랍니다.
        </div>

      </CardContent>
    </Card>
  );
}
