"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { isAIQuoteData, isLegoQuoteData, type QuoteData } from '@/types/quote';

export default function SavingsCalculator({ quoteData }: { quoteData: QuoteData }) {
  let savings = 120000;

  if (isLegoQuoteData(quoteData)) {
    const qty = quoteData.data.configurations?.reduce((sum, config) => sum + (config.quantity || 0), 0) || 0;
    savings = qty * 40000;
  } else if (isAIQuoteData(quoteData)) {
    if (quoteData.data.comparison[0]) {
      savings = Math.round(quoteData.data.comparison[0].finalTotal * 0.04);
    }
  }

  return (
    <Card className="border-none shadow-sm rounded-2xl w-full bg-[#f8fafc]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <span className="mr-2">🌱</span> 난방비 절감 효과 계산기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-slate-500 text-sm mb-2 font-medium">연간 예상 절약액</div>
             <div className="text-3xl font-extrabold text-green-600 transition-all duration-1000 opacity-100">
               {savings.toLocaleString()}원
             </div>
             
             <div className="border-t border-slate-100 my-4" />
             
             <div className="text-slate-500 text-sm mb-2 font-medium">10년 누적 절약액</div>
             <div className="text-2xl font-bold text-slate-800 transition-all duration-1000">
               {(savings * 10).toLocaleString()}원
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4">에너지 효율 등급 향상치</h4>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between text-sm mb-2 font-medium">
                     <span className="text-slate-400">교체 전 (4등급 이하 추정)</span>
                     <span className="text-slate-500">낮음</span>
                   </div>
                   <Progress value={20} className="h-3 bg-red-100" />
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-2 font-medium">
                     <span className="text-blue-700 font-bold">LX지인 뷰프레임 교체 후 (1등급)</span>
                     <span className="text-blue-600 font-bold">최상옵</span>
                   </div>
                   <Progress value={75} className="h-3 bg-slate-100 transition-all duration-1000 ease-out" />
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed mt-4">
                  * 본 절감액은 한국에너지공단 표준 주택 모델 기반의 평균 계산치로, 실제 거실·방의 향 및 사용 패턴에 따라 다를 수 있습니다.
                </p>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
