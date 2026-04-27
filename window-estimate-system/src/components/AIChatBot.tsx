"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatApiResponse, ChatMessage } from '@/types/chat';
import type { QuoteCompleteHandler } from '@/types/quote';

type UIMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_REPLIES = ['30평 아파트 거실 창호 바꾸고 싶어요', '확장형이에요', '예산은 300만 원 정도예요'];

export default function AIChatBot({ onComplete }: { onComplete: QuoteCompleteHandler }) {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: '안녕하세요! 창호 전문 상담 AI입니다. 몇 평대 어떤 공간 창호를 교체하시려는지 말씀해 주세요.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(1);

  const createMessage = (role: UIMessage['role'], content: string): UIMessage => {
    messageIdRef.current += 1;
    return { id: messageIdRef.current, role, content };
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildHistory = (source: UIMessage[]): ChatMessage[] =>
    source
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))
      .slice(-5);

  const sendMessage = async (nextInput: string) => {
    const trimmed = nextInput.trim();
    if (!trimmed || loading) return;

    setError(null);
    const nextUserMessage = createMessage('user', trimmed);
    const nextMessages = [...messages, nextUserMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: buildHistory(nextMessages),
        }),
      });

      if (!response.ok) {
        throw new Error('AI 상담 응답을 받아오지 못했습니다.');
      }

      const data = (await response.json()) as ChatApiResponse;
      const assistantMessage = createMessage('assistant', data.reply);
      setMessages((prev) => [...prev, assistantMessage]);

      const quoteData = data.quoteData;
      if (data.showResult && quoteData) {
        window.setTimeout(() => {
          onComplete(quoteData);
        }, 500);
      }
    } catch (fetchError: unknown) {
      console.error(fetchError);
      const message = fetchError instanceof Error ? fetchError.message : '채팅 전송 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[560px] flex flex-col bg-[#f8fafc] border-slate-200 shadow-sm overflow-hidden rounded-xl">
      <div className="px-5 py-4 border-b bg-white">
        <h3 className="font-bold text-slate-900">AI 창호 상담원</h3>
        <p className="text-sm text-slate-500 mt-1">자연어로 말씀하시면 3턴 안에 가견적을 잡아드립니다.</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-xl shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`px-4 py-3 max-w-[78%] text-[15px] shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[#fee500] text-slate-900 rounded-2xl rounded-tr-sm'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 text-xl">🤖</div>
              <div className="bg-white border text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex space-x-1 items-center h-12 w-16">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div ref={bottomRef} className="h-2" />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t space-y-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              disabled={loading}
              className="px-3 py-2 border border-blue-200 text-blue-700 rounded-full text-sm hover:bg-blue-50 disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="예: 30평 아파트 거실 창호 교체 견적 알려주세요"
            className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-12 px-5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
          >
            전송
          </button>
        </form>
      </div>
    </Card>
  );
}
