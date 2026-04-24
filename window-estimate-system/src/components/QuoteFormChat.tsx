"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: number;
  text: string;
  sender: 'ai' | 'user';
};

const CHAT_QUESTIONS = [
  { id: 1, text: "안녕하세요! 어떤 공간의 창호를 교체하실 예정인가요?", options: ["거실", "안방", "침실", "발코니", "주방", "전체"] },
  { id: 2, text: "해당 공간의 창문은 총 몇 개인가요?", options: ["1개", "2개", "3개", "잘 모르겠음"] },
  { id: 3, text: "대략적인 예산 범위가 어떻게 되시나요?", options: ["100~300만 원", "300~500만 원", "500만 원 이상", "상관없음"] }
];

/**
 * 대화형 3문항 폼: 사용자와 챗봇이 대화하듯 쉽게 답변을 유도하는 방식 
 * (Phase 1 목적: 너무 복잡하지 않은 수준의 딜레이 애니메이션 적용)
 */
export default function QuoteFormChat({ onComplete }: { onComplete: (json: any) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState<boolean>(true);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // 초기 메시지 트리거
  useEffect(() => {
    setTimeout(() => {
      setIsTyping(false);
      setMessages([{ id: Date.now(), text: CHAT_QUESTIONS[0].text, sender: 'ai' }]);
    }, 800);
  }, []);

  // 메시지 업데이트 시 스크롤 하단 고정
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleOptionClick = (option: string) => {
    // 1. 사용자 답변 즉시 등록
    const newMessages: Message[] = [...messages, { id: Date.now(), text: option, sender: 'user' }];
    setMessages(newMessages);

    // 2. 답변 상태 저장
    const currentStepIndex = step;
    const key = `Q${currentStepIndex + 1}`;
    const newAnswers = { ...answers, [key]: option };
    setAnswers(newAnswers);

    // 3. 다음 질문 준비 (타이핑 효과 딜레이)
    const nextStep = currentStepIndex + 1;
    setIsTyping(true);
    
    if (nextStep < CHAT_QUESTIONS.length) {
      setStep(nextStep);
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now(), text: CHAT_QUESTIONS[nextStep].text, sender: 'ai' }]);
      }, 800);
    } else {
      setStep(nextStep);
      
      // 모든 단계 종료 시
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: "감사합니다! 입력하신 정보를 바탕으로 가장 알맞은 창호를 제안해 드릴게요. (결과는 콘솔에 출력되었습니다)", sender: 'ai' }
        ]);
        
        // JSON 변환 및 출력
        const resultJson = {
          type: "chat",
          data: {
             space: newAnswers.Q1,
             count: newAnswers.Q2,
             budget: newAnswers.Q3
          }
        };
        console.log("=== [Chat Form Submitted JSON] ===");
        console.log(JSON.stringify(resultJson, null, 2));
        setTimeout(() => {
          onComplete(resultJson);
        }, 1000);
      }, 1000);
    }
  };

  return (
    <Card className="h-[500px] flex flex-col bg-[#f8fafc] border-slate-200 shadow-sm overflow-hidden rounded-xl">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-xl shrink-0">
                  🤖
                </div>
              )}
              <div 
                className={`px-4 py-3 max-w-[75%] text-[15px] shadow-sm transform transition-all duration-300 ${
                  msg.sender === 'user' 
                    ? 'bg-[#fee500] text-slate-900 rounded-2xl rounded-tr-sm' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* 단순하게 구현한 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 text-xl">🤖</div>
               <div className="bg-white border text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex space-x-1 items-center h-12 w-16">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
               </div>
            </div>
          )}
          <div ref={bottomRef} className="h-2" />
        </div>
      </ScrollArea>

      {/* 액션(질문 옵션) 섹션 */}
      {step < CHAT_QUESTIONS.length && !isTyping && (
        <div className="p-4 bg-white border-t space-y-2 shadow-inner">
           <div className="flex flex-wrap gap-2">
             {CHAT_QUESTIONS[step].options.map(opt => (
               <button 
                 key={opt}
                 onClick={() => handleOptionClick(opt)}
                 className="px-4 py-2 border-[1.5px] border-blue-500 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors"
               >
                 {opt}
               </button>
             ))}
           </div>
        </div>
      )}
    </Card>
  );
}
