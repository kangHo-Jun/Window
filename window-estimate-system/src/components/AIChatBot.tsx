"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import ChatProgress from './ChatProgress';
import SmartOptions from './SmartOptions';
import { getQuoteLevelButtonLabel } from '@/lib/quoteLevelEngine';
import QuoteCard from './QuoteCard';
import type { ChatApiResponse, ChatMessage, ConsumerGroupInfo, ExtractedChatFields, PendingSkip, SentimentType, SkipFieldMap } from '@/types/chat';
import type { AIQuoteData, QuoteCompleteHandler, QuoteLevel } from '@/types/quote';

type UIMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

function sanitizeAssistantReply(reply: string): string {
  if (!reply) {
    return '조금만 더 쉽게 말씀해 주시면 바로 도와드릴게요 😊';
  }

  const trimmed = reply.trim();
  if (!trimmed.startsWith('{') || !trimmed.includes('"reply"')) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as { reply?: unknown };
    return typeof parsed.reply === 'string' && parsed.reply
      ? parsed.reply
      : '답변 형식을 정리하는 중에 잠깐 꼬였어요. 한 번만 더 말씀해 주시면 바로 이어서 도와드릴게요 😊';
  } catch {
    const match = trimmed.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (match) {
      return JSON.parse(`"${match[1]}"`) as string;
    }

    return '답변 형식을 정리하는 중에 잠깐 꼬였어요. 한 번만 더 말씀해 주시면 바로 이어서 도와드릴게요 😊';
  }
}

// 초기 빈 필드 상태
const INITIAL_FIELDS: ExtractedChatFields = {
  customerName: '',
  housingType: '',
  pyeong: '',
  expansion: '',
  space: '',
  count: '1개',
  age: '',
  problem: '',
  timing: '',
  floor: '',
  corner: '',
  brandPreference: '',
  lifestyle: '',
  noiseSensitive: '',
  priority: ''
};

export default function AIChatBot({ onComplete, onReset }: { onComplete: QuoteCompleteHandler; onReset: () => void }) {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: '안녕하세요! 저는 창호 전문 상담사 지인이예요 😊 어떤 형태의 집에 사세요?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<ExtractedChatFields>(INITIAL_FIELDS);
  const [canShowQuickQuote, setCanShowQuickQuote] = useState(false);
  const [quickQuoteData, setQuickQuoteData] = useState<AIQuoteData | null>(null);
  const [quoteLevel, setQuoteLevel] = useState<QuoteLevel>(0);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [sentiment, setSentiment] = useState<SentimentType>('NEUTRAL');
  const [emphasizeOptions, setEmphasizeOptions] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [skippedFields, setSkippedFields] = useState<SkipFieldMap>({});
  const [pendingSkip, setPendingSkip] = useState<PendingSkip | null>(null);
  const [consultationNeeded, setConsultationNeeded] = useState(false);
  // 초기값 housingType: 첫 인사 후 즉시 주거형태 버튼 표시
  const [currentQuestionField, setCurrentQuestionField] = useState<keyof ExtractedChatFields | null>('housingType');
  const [streamingReplyId, setStreamingReplyId] = useState<number | null>(null);
  const [inlineQuoteData, setInlineQuoteData] = useState<AIQuoteData | null>(null);
  const [consumerGroupInfo, setConsumerGroupInfo] = useState<ConsumerGroupInfo | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showTabletSidebar, setShowTabletSidebar] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
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

  const applyChatResponse = (data: ChatApiResponse) => {
    if (data.extractedFields) {
      setFields(data.extractedFields);
    }

    setCanShowQuickQuote(data.canShowQuickQuote);
    setQuickQuoteData(data.quickQuoteData);
    setQuoteLevel(data.quoteLevel);
    setFallbackCount(data.fallbackCount);
    setSentiment(data.sentiment);
    setEmphasizeOptions(data.emphasizeOptions);
    setSuggestedReplies(data.suggestedReplies);
    setSkippedFields(data.skippedFields);
    setPendingSkip(data.pendingSkip);
    setConsultationNeeded(data.consultationNeeded);
    setCurrentQuestionField(data.currentQuestionField);
    if (data.quickQuoteData) setInlineQuoteData(data.quickQuoteData);
    if (data.consumerGroup) setConsumerGroupInfo(data.consumerGroup);

    if (data.showResult && data.quoteData) {
      window.setTimeout(() => {
        onComplete(data.quoteData!);
      }, 500);
    }
  };

  const sendMessage = async (nextInput: string) => {
    const trimmed = nextInput.trim();
    if (!trimmed || loading) return;

    setError(null);
    const nextUserMessage = createMessage('user', trimmed);
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput('');
    setLoading(true);
    const assistantPlaceholder = createMessage('assistant', '');

    try {
      setMessages((prev) => [...prev, assistantPlaceholder]);
      setStreamingReplyId(assistantPlaceholder.id);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: buildHistory(messages),
          fields,
          fallbackCount,
          skippedFields,
          pendingSkip,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 상담 응답을 받아오지 못했습니다.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalPayload: ChatApiResponse | null = null;

        const appendAssistantChunk = (chunk: string) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, content: `${message.content}${chunk}` }
                : message,
            ),
          );
        };

        const setAssistantReply = (reply: string) => {
          const sanitized = sanitizeAssistantReply(reply);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, content: sanitized }
                : message,
            ),
          );
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            const lines = block.split('\n').filter(Boolean);
            const event = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
            const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();
            if (!event || !dataLine) continue;

            if (event === 'reply') {
              const parsed = JSON.parse(dataLine) as { chunk?: string };
              if (parsed.chunk) {
                appendAssistantChunk(parsed.chunk);
              }
            }

            if (event === 'done') {
              finalPayload = JSON.parse(dataLine) as ChatApiResponse;
            }

            if (event === 'error') {
              const parsed = JSON.parse(dataLine) as { message?: string };
              throw new Error(parsed.message || '채팅 처리 중 오류가 발생했습니다.');
            }
          }
        }

        if (!finalPayload) {
          throw new Error('스트리밍 응답이 비정상적으로 종료되었습니다.');
        }

        setAssistantReply(finalPayload.reply);
        applyChatResponse(finalPayload);
      } else {
        const data = (await response.json()) as ChatApiResponse;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantPlaceholder.id
              ? { ...message, content: sanitizeAssistantReply(data.reply) }
              : message,
          ),
        );
        applyChatResponse(data);
      }
    } catch (fetchError: unknown) {
      console.error(fetchError);
      const message = fetchError instanceof Error ? fetchError.message : '채팅 전송 중 오류가 발생했습니다.';
      setError(message);
      setMessages((prev) =>
        prev.filter((message) => message.id !== assistantPlaceholder.id),
      );
    } finally {
      setStreamingReplyId(null);
      setLoading(false);
    }
  };

  const toneClass =
    sentiment === 'FRUSTRATED' ? 'border-amber-200 bg-amber-50/40' :
    sentiment === 'CONFUSED' ? 'border-cyan-200 bg-cyan-50/40' :
    sentiment === 'SATISFIED' ? 'border-emerald-200 bg-emerald-50/30' :
    'border-slate-200 bg-[#fcfdfe]';

  const sidebarFields: Array<{ key: keyof ExtractedChatFields; label: string }> = [
    { key: 'housingType', label: '주거형태' },
    { key: 'pyeong', label: '평형' },
    { key: 'expansion', label: '확장' },
    { key: 'space', label: '공간' },
    { key: 'age', label: '연식' },
    { key: 'problem', label: '불편사항' },
    { key: 'timing', label: '시공시기' },
  ];

  const collectedCount = sidebarFields.filter(({ key }) => Boolean(fields[key])).length;

  const sidebarContent = (
    <div className="space-y-4 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-2">
        {sidebarFields.map(({ key, label }) => {
          const value = fields[key];
          const filled = Boolean(value);

          return (
            <div
              key={key}
              className={`rounded-2xl border px-3 py-3 transition-colors ${
                filled
                  ? 'border-[#d7e5dc] bg-[#f6fbf7]'
                  : 'border-slate-200 bg-slate-50/80'
              }`}
            >
              <p className="text-[10px] font-semibold tracking-[0.08em] text-slate-400">{label}</p>
              <p className={`mt-1 text-sm font-bold ${filled ? 'text-[#204537]' : 'text-slate-400'}`}>
                {filled ? value : '대기중'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-[#f7f7f4] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">현재 견적 레벨</p>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {quoteLevel === 3 ? '정밀 가견적' : quoteLevel === 2 ? '가견적' : quoteLevel === 1 ? '빠른 가견적' : '정보 수집 단계'}
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-bold ${
            quoteLevel === 3 ? 'bg-[#e6f1ea] text-[#24533f]' :
            quoteLevel === 2 ? 'bg-[#eef2f7] text-[#324967]' :
            quoteLevel === 1 ? 'bg-[#f8eddc] text-[#9a6020]' :
            'bg-slate-200 text-slate-600'
          }`}>
            {quickQuoteData?.data.errorRange || '준비중'}
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {quoteLevel === 0 && '주거형태, 평형, 확장 여부가 모이면 첫 가견적이 열립니다.'}
          {quoteLevel === 1 && '기본 가견적이 준비됐습니다. 공간과 연식이 모이면 더 정확해집니다.'}
          {quoteLevel === 2 && '비교 가능한 수준까지 왔습니다. 심층 정보가 모이면 정밀 견적으로 올라갑니다.'}
          {quoteLevel === 3 && '현재 가장 정교한 상태입니다. 바로 상세 결과나 상담으로 연결할 수 있습니다.'}
        </p>
      </div>

      {inlineQuoteData ? (
        <QuoteCard
          data={inlineQuoteData}
          consumerGroup={consumerGroupInfo ?? undefined}
          skippedFields={skippedFields}
          onViewFull={() => onComplete(inlineQuoteData)}
          onCallConsult={() => {
            const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-0000-0000';
            window.location.href = `tel:${phone}`;
          }}
        />
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-5 py-8 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-900">아직 견적 카드가 열리지 않았습니다.</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            이 패널은 대화가 쌓일수록 자동으로 업데이트됩니다.
            먼저 기본 정보 3개를 모아 보세요.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="hidden rounded-2xl border border-slate-200 bg-white shadow-md md:block lg:hidden">
        <button
          type="button"
          onClick={() => setShowTabletSidebar((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Estimate Status</p>
            <h4 className="mt-1 text-base font-extrabold text-slate-900">수집현황과 가견적</h4>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {collectedCount}/7
            </span>
            <span className="text-lg text-slate-400">{showTabletSidebar ? '−' : '+'}</span>
          </div>
        </button>
        {showTabletSidebar && (
          <div className="border-t border-slate-100">
            {sidebarContent}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <Card className={`h-[620px] min-h-0 flex flex-col shadow-xl overflow-hidden rounded-2xl relative ${toneClass}`}>
        <div className="border-b bg-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 flex items-center">
              지인이 <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">LX지인 창호 전문가 (10년차)</p>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              🔄 처음부터
            </button>
            <a
              href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-0000-0000'}`}
              className={`rounded-full px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors ${consultationNeeded ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              📞 전화 상담
            </a>
            {canShowQuickQuote && quickQuoteData && (
              <button
                type="button"
                onClick={() => setShowQuoteModal(true)}
                className={`min-w-0 rounded-full border px-2.5 py-2 text-[11px] font-bold shadow-sm transition-colors sm:px-3 sm:text-xs ${
                  quoteLevel === 3 ? 'border-[#c8ddd2] bg-[#edf6f0] text-[#24533f] hover:bg-[#e2f0e7]' :
                  quoteLevel === 2 ? 'border-[#d6dee9] bg-[#f4f7fb] text-[#324967] hover:bg-[#e9eff6]' :
                  'border-[#ead7bb] bg-[#fbf3e6] text-[#9a6020] hover:bg-[#f6ebda]'
                }`}
              >
                {getQuoteLevelButtonLabel(quoteLevel, skippedFields) || quickQuoteData.data.errorRange}
              </button>
            )}
          </div>
          </div>
        </div>

        <ChatProgress fields={fields} skippedFields={skippedFields} />

        <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-slate-50/30">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center mr-2 text-xl shrink-0 shadow-sm">
                    👩‍💼
                  </div>
                )}
                <div
                  className={`px-4 py-3 max-w-[85%] text-[15px] leading-relaxed shadow-sm transition-all duration-300 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && streamingReplyId === null && (
              <div className="flex justify-start">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center mr-2 shrink-0 text-xl shadow-sm">👩‍💼</div>
                <div className="bg-white border text-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex space-x-1 items-center h-12 w-16">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mx-auto max-w-[90%] text-center">
                ⚠️ {error}
              </div>
            )}

            <div ref={bottomRef} className="h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border-t space-y-4">
          <SmartOptions
            currentQuestionField={currentQuestionField}
            onSelect={sendMessage}
            loading={loading}
            emphasize={emphasizeOptions || fallbackCount >= 2}
            suggestedReplies={suggestedReplies}
          />
          
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
            className="flex gap-2 relative"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="이곳에 궁금하신 점이나 답변을 적어주세요..."
              className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white disabled:opacity-50 pr-12 shadow-inner"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1.5 h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-md active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>

        {showQuoteModal && inlineQuoteData && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-2xl p-4"
            onClick={() => setShowQuoteModal(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                <span className="font-bold text-slate-900 text-sm">가견적 결과</span>
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-lg font-bold"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>

              <div className="p-3">
                <QuoteCard
                  data={inlineQuoteData}
                  consumerGroup={consumerGroupInfo ?? undefined}
                  skippedFields={skippedFields}
                  onViewFull={() => {
                    setShowQuoteModal(false);
                    onComplete(inlineQuoteData);
                  }}
                  onCallConsult={() => {
                    const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-0000-0000';
                    window.location.href = `tel:${phone}`;
                  }}
                />
              </div>

              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  더 정확한 견적 → 계속 대화하기
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <aside className="hidden lg:block lg:h-[620px]">
        <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-slate-200 bg-[#f7f6f2] px-5 py-4">
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Estimate Status</p>
                <h4 className="mt-1 text-lg font-extrabold text-slate-900">실시간 견적 현황</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">대화가 쌓일수록 이 패널이 자동으로 더 정교해집니다.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] text-slate-400">수집</p>
                <p className="text-sm font-extrabold text-slate-900">{collectedCount}/7</p>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col overflow-hidden">
            {sidebarContent}
          </div>
        </Card>
      </aside>
      </div>

      {showQuoteModal && inlineQuoteData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowQuoteModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
              <span className="font-bold text-slate-900 text-sm">가견적 결과</span>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-lg font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* QuoteCard */}
            <div className="p-3">
              <QuoteCard
                data={inlineQuoteData}
                consumerGroup={consumerGroupInfo ?? undefined}
                skippedFields={skippedFields}
                onViewFull={() => {
                  setShowQuoteModal(false);
                  onComplete(inlineQuoteData);
                }}
                onCallConsult={() => {
                  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-0000-0000';
                  window.location.href = `tel:${phone}`;
                }}
              />
            </div>

            {/* 계속 대화 버튼 */}
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                더 정확한 견적 → 계속 대화하기
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMobileSidebar(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-2xl md:hidden"
      >
        📋 견적현황 보기
      </button>

      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-50 bg-black/45 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[78vh] overflow-hidden rounded-t-[28px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Estimate Status</p>
                <h4 className="mt-1 text-base font-extrabold text-slate-900">실시간 견적 현황</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileSidebar(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500"
              >
                닫기
              </button>
            </div>
            <div className="max-h-[calc(78vh-76px)] overflow-y-auto border-t border-slate-100">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
