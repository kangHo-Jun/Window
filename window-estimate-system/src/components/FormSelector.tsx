"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuoteFormLego from './QuoteFormLego';
import QuoteFormChat from './QuoteFormChat';
import type { QuoteCompleteHandler } from '@/types/quote';

/**
 * 두 가지 견적 폼(레고식, 대화형)을 선택할 수 있는 컨테이너 컴포넌트
 */
export default function FormSelector({ onComplete }: { onComplete: QuoteCompleteHandler }) {
  return (
    <div className="w-full max-w-2xl mx-auto shadow-sm p-4 md:p-6 bg-white rounded-2xl border">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 rounded-xl mb-4">
          <TabsTrigger value="chat" className="h-full rounded-lg font-medium text-base">
            대화형 (간편 견적)
          </TabsTrigger>
          <TabsTrigger value="lego" className="h-full rounded-lg font-medium text-base">
            레고식 (직접 입력)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
          <QuoteFormChat onComplete={onComplete} />
        </TabsContent>
        <TabsContent value="lego" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
          <QuoteFormLego onComplete={onComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
