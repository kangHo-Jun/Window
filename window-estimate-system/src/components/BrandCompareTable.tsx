"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { BrandCompareItem, QuoteData } from '@/types/quote';

const SAMPLE_RESULTS: BrandCompareItem[] = [
  {
    brand: 'LX지인',
    rawTotal: 12000000,
    marginAmount: 3600000,
    installAmount: 2400000,
    discountAmount: 900000,
    finalTotal: 17100000,
    isRecommended: true,
  },
  {
    brand: 'KCC글라스',
    rawTotal: 9000000,
    marginAmount: 2250000,
    installAmount: 1800000,
    discountAmount: 391500,
    finalTotal: 12658500,
    isRecommended: false,
  },
  {
    brand: '기타',
    rawTotal: 7000000,
    marginAmount: 1400000,
    installAmount: 1260000,
    discountAmount: 0,
    finalTotal: 9660000,
    isRecommended: false,
  },
];

export default function BrandCompareTable({ quoteData }: { quoteData: QuoteData }) {
  if (!quoteData) {
    return <div className="text-center p-8 text-slate-500 font-medium">가견적 산출 중... (룰 엔진 가동)</div>;
  }

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl w-full">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
        <CardTitle className="text-lg">3사 브랜드 가견적 비교표</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {SAMPLE_RESULTS.map((res) => (
            <div key={res.brand} className={`p-6 relative transition-colors ${res.isRecommended ? 'bg-[#f0f9ff]' : 'hover:bg-slate-50'}`}>
              {res.isRecommended && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  추천
                </span>
              )}
              <h3 className="text-xl font-bold mb-1">{res.brand}</h3>
              <p className="text-sm text-slate-500 mb-6">
                {res.brand === 'LX지인' ? '프리미엄' : res.brand === 'KCC글라스' ? '중간 포지션' : '실속형 보급'}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">제품 원가</span>
                  <span>{res.rawTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">마진 및 시공비</span>
                  <span>{(res.marginAmount + res.installAmount).toLocaleString()}원</span>
                </div>
                {res.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-500 font-medium">
                    <span>할인 금액</span>
                    <span>-{res.discountAmount.toLocaleString()}원</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 border-slate-200">
                <div className="text-sm text-slate-500 mb-1">최종 예상 견적액</div>
                <div className={`text-2xl font-extrabold ${res.isRecommended ? 'text-blue-700' : 'text-slate-900'}`}>
                  {res.finalTotal.toLocaleString()}원
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
