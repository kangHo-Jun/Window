"use client";

import React, { useState } from 'react';
import FormSelector from '@/components/FormSelector';
import QuoteResult from '@/components/QuoteResult';
import type { QuoteData } from '@/types/quote';

/**
 * 창호 견적 시스템 메인 페이지
 * 
 * 1. 컴포넌트 역할: 사용자가 견적을 시작할 수 있는 랜딩 및 폼 진입점.
 * 2. FormSelector 컴포넌트: 레고식(상세) / 채팅형(간편) 폼 중 선택 제공
 */
export default function HomePage() {
  const [resultData, setResultData] = useState<QuoteData | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-8 mt-8">
        
        {/* 헤더 타이틀 영역 */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            나만의 창·작품 SYNC
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            LX지인, KCC글라스, 기타 브랜드를 한눈에 비교하고 스마트한 창호 견적을 받아보세요. 
            원하는 방식으로 견적을 시작할 수 있습니다.
          </p>
        </section>

        {/* 폼 선택 및 렌더링 영역 */}
        <section className="w-full pt-4">
          {!resultData ? (
             <FormSelector onComplete={(data) => setResultData(data)} />
          ) : (
             <QuoteResult data={resultData} onReset={() => setResultData(null)} />
          )}
        </section>
        
      </div>
    </main>
  );
}
