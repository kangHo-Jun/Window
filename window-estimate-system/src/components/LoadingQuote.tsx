"use client";

export function LoadingQuote({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex justify-start">
      <div className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl shadow-sm">
        👩‍💼
      </div>
      <div className="animate-fade-in flex max-w-xs flex-col gap-2 rounded-2xl rounded-tl-none border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">{step === 1 ? "🔍" : "✅"}</span>
          <span className="text-sm text-gray-600">
            {step === 1 ? "잠깐만요, 견적을 계산하고 있어요" : "견적 준비가 완료됐어요"}
          </span>
        </div>

        {step === 1 && (
          <div className="h-1 overflow-hidden rounded-full bg-gray-100">
            <div className="animate-progress h-full rounded-full bg-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
}
