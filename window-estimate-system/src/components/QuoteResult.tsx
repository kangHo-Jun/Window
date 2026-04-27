"use client";

import React from 'react';
import BrandCompareTable from './BrandCompareTable';
import SavingsCalculator from './SavingsCalculator';
import ConsultingReport from './ConsultingReport';
import PDFDownload from './PDFDownload';
import ConsultationForm from './ConsultationForm';
import ConsultationSuccess from './ConsultationSuccess';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import type { QuoteData } from '@/types/quote';

export default function QuoteResult({ data, onReset }: { data: QuoteData | null; onReset: () => void }) {
  const [showForm, setShowForm] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  if (!data) return null;

  if (isSuccess) {
    return <ConsultationSuccess onReset={onReset} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto">
      <div className="text-center mb-10 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          견적 산출이 완료되었습니다
        </h2>
        <p className="text-slate-500 mt-2">
          고객님이 선택하신 내역을 바탕으로 3사 브랜드 가견적을 즉시 비교해 드립니다.
        </p>
      </div>

      <div className="space-y-8">
        <BrandCompareTable quoteData={data} />
        <SavingsCalculator quoteData={data} />
        <ConsultingReport quoteData={data} />
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-8 border-t border-slate-200 mt-8">
        <Button variant="outline" size="lg" onClick={onReset} className="w-full sm:w-auto px-8 h-[72px] rounded-xl font-medium text-slate-600">
          다시 견적내기
        </Button>
        <div className="w-full sm:w-80">
          <PDFDownload quoteData={data} />
        </div>
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
