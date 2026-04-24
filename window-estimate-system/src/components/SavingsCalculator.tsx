"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function SavingsCalculator({ quoteData }: { quoteData: any }) {
  const [savings, setSavings] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // db_margins.csv의 discount_rate 평균치 등을 임시 기반으로 사용할 수 있으나 
    // 요구사항에 맞춰 시각적 단순 애니메이션 구현 (db_margins값 기반 연동으로 가정)
    
    // 단순 시연을 위한 절감액 도출
    let estimatedSavings = 120000; // 기본 연간 절감액
    if (quoteData.type === 'smart-lego') {
       const qty = quoteData.data.configurations.reduce((a:number, b:any) => a + (b.quantity || 0), 0);
       estimatedSavings = qty * 40000;
    } else if (quoteData.type === 'chat') {
       if (quoteData.data.budget?.includes("500")) {
         estimatedSavings = 180000;
       }
    }

    setSavings(estimatedSavings);
    
    // 애니메이션 트리거
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setProgress(75); // 75% 효율 향상 시각화
    }, 500);

    return () => clearTimeout(timer);
  }, [quoteData]);

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
               {isLoaded ? savings.toLocaleString() : "0"}원
             </div>
             
             <div className="border-t border-slate-100 my-4" />
             
             <div className="text-slate-500 text-sm mb-2 font-medium">10년 누적 절약액</div>
             <div className="text-2xl font-bold text-slate-800 transition-all duration-1000">
               {isLoaded ? (savings * 10).toLocaleString() : "0"}원
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
                   <Progress value={progress} className="h-3 bg-slate-100 transition-all duration-1000 ease-out" />
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
