"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConsultationSuccess({ onReset }: { onReset: () => void }) {
  const adminPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "010-0000-0000";

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">상담 신청이 완료되었습니다!</h2>
        <p className="text-slate-500">
          입력하신 연락처로 전문 상담사가 업무 시간 내에 전화를 드릴 예정입니다.
        </p>
      </div>

      <Card className="bg-slate-50 border-slate-100 max-w-sm w-full">
        <CardContent className="p-4 flex items-center justify-between">
           <div className="text-sm font-medium text-slate-500">담당자 직통 번호</div>
           <div className="text-lg font-bold text-blue-600">{adminPhone}</div>
        </CardContent>
      </Card>

      <Button onClick={onReset} variant="outline" className="px-12 rounded-xl">
        메인으로 돌아가기
      </Button>
    </div>
  );
}
