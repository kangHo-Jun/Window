import {
  buildQuickQuoteData,
  buildQuoteData,
  extractDeterministicFields,
  GEMINI_MODEL,
  getRagContext,
  needsGeminiAssistance,
  normalizePyeongValue,
  shouldShowResult,
} from '@/lib/ragEngine';
import { getNextQuestion } from '@/lib/dynamicQuestion';
import { getQuoteLevel } from '@/lib/quoteLevelEngine';
import { classifyConsumer } from '@/lib/consumerGrouping';
import { loadConfigurationRows, preloadDbCache } from '@/lib/dbLoader';
import { appendConsultationSheetRow } from '@/app/api/sheets/route';
import type {
  ChatApiResponse,
  ChatMessage,
  ChatRequest,
  ExtractedChatFields,
} from '@/types/chat';

const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
const encoder = new TextEncoder();

const CONV_LABELS: Partial<Record<keyof ExtractedChatFields, string>> = {
  housingType: '주거형태',
  pyeong: '평형',
  expansion: '확장여부',
  spaces: '교체공간',
  age: '창호연식',
  problem: '불편사항',
  timing: '시공시기',
};

const CONSUMER_VISIBLE_SPACES = ['거실', '안방', '침실1', '침실2', '알파룸', '주방', '다용도실'] as const;

function createEmptyFields(): ExtractedChatFields {
  return {
    customerName: '', housingType: '', pyeong: '', expansion: '',
    spaces: [], spaceSizes: {}, count: '1개', age: '', problem: '', timing: '',
    floor: '', corner: '', brandPreference: '', lifestyle: '',
    noiseSensitive: '', priority: '',
  };
}

function isFilled(value: string | string[] | Record<string, '소' | '중' | '대' | '모름'>) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
  return Boolean(value && value !== 'null' && value !== '');
}

function normalizeFieldValue(
  key: keyof ExtractedChatFields,
  value: string | string[] | Record<string, '소' | '중' | '대' | '모름'>,
): string | string[] | Record<string, '소' | '중' | '대' | '모름'> {
  if (key === 'spaces') {
    if (!Array.isArray(value)) return [];
    return value.filter(Boolean).map((item) => item === '발코니' ? '거실' : item);
  }
  if (key === 'spaceSizes') {
    if (Array.isArray(value) || typeof value !== 'object' || value === null) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, size]) => ['소', '중', '대', '모름'].includes(size)),
    );
  }
  if (Array.isArray(value)) return '';
  if (typeof value === 'object') return {};
  if (!value || value === 'null') return '';

  if (key === 'housingType') {
    if (value === '오피스텔') return '아파트';
    return ['아파트', '빌라', '단독주택'].includes(value) ? value : '';
  }
  if (key === 'customerName') {
    const normalized = value.trim().replace(/님$/, '');
    return /^[가-힣]{2,5}$/.test(normalized) ? normalized : '';
  }
  if (key === 'expansion') return ['확장형', '비확장형', '부분확장'].includes(value) ? value : '';
  if (key === 'age') return ['10년이하', '10~20년', '20년이상'].includes(value) ? value : '';
  if (key === 'problem') return ['단열', '소음', '결로', '바람'].includes(value) ? value : '';
  if (key === 'timing') return ['즉시', '1~3개월', '6개월이후', '미정'].includes(value) ? value : '';
  if (key === 'pyeong') {
    const valid = ['20평대', '30평대', '40평대', '50평대+'];
    if (valid.includes(value)) return value;
    const digits = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(digits)) {
      if (digits <= 25) return '20평대';
      if (digits <= 35) return '30평대';
      if (digits <= 45) return '40평대';
      return '50평대+';
    }
    return '';
  }
  return value;
}

function mergeFields(base: ExtractedChatFields, overrides?: Partial<ExtractedChatFields>) {
  const merged = { ...base };
  if (!overrides) return merged;
  (Object.entries(overrides) as Array<[
    keyof ExtractedChatFields,
    string | string[] | Record<string, '소' | '중' | '대' | '모름'> | undefined
  ]>).forEach(([key, value]) => {
    if (key === 'spaceSizes' && value && typeof value === 'object' && !Array.isArray(value)) {
      merged.spaceSizes = {
        ...merged.spaceSizes,
        ...(normalizeFieldValue(key, value) as Record<string, '소' | '중' | '대' | '모름'>),
      };
      return;
    }
    if (Array.isArray(value)) {
      const normalized = normalizeFieldValue(key, value) as string[];
      if (normalized.length > 0) {
        merged[key] = normalized as never;
      }
      return;
    }
    if (value && value !== 'null' && value !== '') {
      const normalized = normalizeFieldValue(key, value);
      if (Array.isArray(normalized) ? normalized.length > 0 : normalized) merged[key] = normalized as never;
    }
  });
  return merged;
}

function getOptionsForField(field: keyof ExtractedChatFields | null) {
  switch (field) {
    case 'housingType': return ['아파트', '빌라', '단독주택'];
    case 'pyeong': return ['20평대', '30평대', '40평대'];
    case 'expansion': return ['확장형', '비확장형', '부분확장'];
    case 'spaces': return [];
    case 'age': return ['10년이하', '10~20년', '20년이상'];
    case 'problem': return ['단열', '소음', '결로'];
    case 'timing': return ['즉시', '1~3개월', '6개월이후'];
    default: return [];
  }
}

function buildLocalReply(previousFields: ExtractedChatFields, fields: ExtractedChatFields, officeTelDetected: boolean) {
  const name = isFilled(fields.customerName) ? `${fields.customerName}님` : '고객님';
  const nextQuestion = getNextQuestion(fields);
  const currentQuestionField = nextQuestion?.key ?? null;
  const changedField = (Object.keys(CONV_LABELS) as Array<keyof ExtractedChatFields>).find(
    (key) => !isFilled(previousFields[key]) && isFilled(fields[key]),
  );

  let reply = '조금만 더 쉽게 말씀해 주시면 바로 도와드릴게요 😊';

  if (shouldShowResult(fields)) {
    reply = '필요한 정보를 모두 파악했어요! 바로 가견적을 보여드릴게요 😊';
  } else if (!isFilled(previousFields.customerName) && isFilled(fields.customerName)) {
    reply = `${name} 반가워요 😊 ${nextQuestion?.question ?? '이제 바로 가견적을 도와드릴게요.'}`;
  } else if (officeTelDetected) {
    reply = `오피스텔은 아파트 구조와 유사해서 아파트 기준으로 견적 잡아드릴게요 😊 ${nextQuestion?.question ?? ''}`.trim();
  } else if (changedField && nextQuestion) {
    reply = `${CONV_LABELS[changedField]} 확인했어요 😊 ${nextQuestion.question}`;
  } else if (nextQuestion) {
    reply = nextQuestion.question;
  } else if (getQuoteLevel(fields) >= 1) {
    reply = `${name} 지금 바로 가견적 보실 수 있어요 😊 더 정확한 견적을 원하시면 대화를 이어가셔도 됩니다.`;
  }

  return { reply, options: getOptionsForField(currentQuestionField), currentQuestionField };
}

async function getSpaceOptions(fields: ExtractedChatFields) {
  if (!fields.pyeong || !fields.expansion) return [];
  const rows = await loadConfigurationRows();
  const normalizedPyeong = normalizePyeongValue(fields.pyeong);
  const matchedRows = rows.filter((row) => normalizePyeongValue(row.pyeong) === normalizedPyeong && row.expansion === fields.expansion);
  const fallbackRows =
    fields.expansion === '부분확장' && matchedRows.length === 0
      ? rows.filter((row) => normalizePyeongValue(row.pyeong) === normalizedPyeong && row.expansion === '비확장형')
      : matchedRows;

  return fallbackRows
    .sort((left, right) => Number(left.space_order) - Number(right.space_order))
    .map((row) => row.space_name)
    .filter((space) => CONSUMER_VISIBLE_SPACES.includes(space as typeof CONSUMER_VISIBLE_SPACES[number]))
    .filter((space, index, array) => array.indexOf(space) === index);
}

function getNextSpaceForSizing(fields: ExtractedChatFields) {
  return fields.spaces.find((space) => !fields.spaceSizes[space]) || null;
}

function hasCompletedSpaceSizes(fields: ExtractedChatFields) {
  return fields.spaces.length > 0 && fields.spaces.every((space) => Boolean(fields.spaceSizes[space]));
}

function buildSystemPrompt(fields: ExtractedChatFields, history: ChatMessage[], userMessage: string) {
  const name = isFilled(fields.customerName) ? `${fields.customerName}님` : '고객님';
  const nextQuestion = getNextQuestion(fields);
  const memoryCue = fields.problem || fields.priority
    ? `- 이미 들은 핵심 맥락은 "${fields.problem || fields.priority}" 이다.\n- "아까 ${fields.problem || fields.priority} 때문이라고 하셨잖아요"처럼 자연스럽게 연결해도 된다.`
    : '- 맥락 연결 멘트는 실제로 수집된 정보가 있을 때만 사용해라.';

  const collected = (Object.keys(CONV_LABELS) as Array<keyof ExtractedChatFields>)
    .filter((key) => isFilled(fields[key]))
    .map((key) => `${CONV_LABELS[key]}: ${Array.isArray(fields[key]) ? fields[key].join(', ') : fields[key]}`)
    .join(', ') || '없음';

  const missing = (Object.keys(CONV_LABELS) as Array<keyof ExtractedChatFields>)
    .filter((key) => !isFilled(fields[key]))
    .map((key) => CONV_LABELS[key])
    .join(', ') || '없음';

  const historyText = history
    .slice(-4)
    .map((item) => `${item.role === 'user' ? '고객' : '지인이'}: ${item.content}`)
    .join('\n') || '없음';

  return `너는 LX지인 창호 전문 상담사 "지인이"야.
고객 호칭은 ${name}이고, 말투는 친근하지만 전문적이어야 해.

[현재 파악 완료]
${collected}

[아직 필요한 정보]
${missing}

[최근 대화]
${historyText}

[방금 고객 입력]
${userMessage}

[핵심 규칙]
- 모든 답변은 2~3문장 이내
- 문장을 반드시 완성해서 끝낼 것. 절대 중간에 자르지 말 것.
- 한 번에 하나의 질문만
- 이미 파악한 정보는 절대 다시 묻지 마라
- 오피스텔은 아파트 기준으로 판단
- 주거형태는 아파트/빌라/단독주택 중 하나
- 이번 입력에서 새로 확정한 값만 fieldUpdates에 넣어라
- 명확하지 않은 값은 절대 추측하지 말고 fieldUpdates에서 제외해라
- 다음 질문이 필요하면 ${nextQuestion?.key ?? 'null'} 기준으로 자연스럽게 이어가라
${memoryCue}

[출력 형식]
첫 줄부터 고객에게 보여줄 답변만 먼저 출력
마지막 줄에는 반드시 아래 태그만 추가
<json>{"fieldUpdates":{"housingType":"아파트"},"options":["30평대","40평대"],"currentQuestionField":"pyeong"}</json>`;
}

function parseGeminiEnvelope(raw: string) {
  const jsonStart = raw.indexOf('<json>');
  const reply = (jsonStart === -1 ? raw : raw.slice(0, jsonStart)).trim();
  const jsonMatch = raw.match(/<json>([\s\S]*?)<\/json>/);

  if (!jsonMatch) {
    return {
      reply,
      options: [] as string[],
      currentQuestionField: null as keyof ExtractedChatFields | null,
      fieldUpdates: {} as Partial<ExtractedChatFields>,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]) as {
      fieldUpdates?: Partial<ExtractedChatFields>;
      options?: string[];
      currentQuestionField?: keyof ExtractedChatFields | null;
    };
    return {
      reply,
      options: Array.isArray(parsed.options) ? parsed.options : [],
      currentQuestionField: parsed.currentQuestionField ?? null,
      fieldUpdates: parsed.fieldUpdates ?? {},
    };
  } catch {
    return { reply, options: [], currentQuestionField: null, fieldUpdates: {} as Partial<ExtractedChatFields> };
  }
}

function encodeSse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function streamGeminiReply(
  prompt: string,
  apiKey: string,
  onReplyChunk: (chunk: string) => void,
) {
  const response = await fetch(`${GEMINI_STREAM_URL}&key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 2000 },
    }),
  });

  if (!response.ok || !response.body) throw new Error(`Gemini API Error: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = '';
  let lineBuffer = '';
  let streamedReplyLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.replace(/^data:\s*/, '');
      if (!payload || payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const piece = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        if (!piece) continue;

        raw += piece;

        // <json> 태그 이전까지만 스트리밍
        const jsonStart = raw.indexOf('<json>');
        const visibleText = jsonStart === -1 ? raw : raw.slice(0, jsonStart);
        if (visibleText.length > streamedReplyLength) {
          onReplyChunk(visibleText.slice(streamedReplyLength));
          streamedReplyLength = visibleText.length;
        }
      } catch { /* partial JSON 무시 */ }
    }
  }

  return raw;
}

export async function POST(req: Request) {
  try {
    const startedAt = Date.now();
    const body = (await req.json()) as ChatRequest;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'API Key missing' }, { status: 500 });
    await preloadDbCache();

    const history = (body.history ?? []).slice(-6);
    const previousFields = mergeFields(createEmptyFields(), body.fields ?? createEmptyFields());

    // STEP 1: 정규식 fast-path (0ms)
    const deterministicFields = extractDeterministicFields(body.message, history);
    deterministicFields.customerName = ''; // 오탐 방지
    const officeTelDetected = body.message.includes('오피스텔');
    const shouldUseGemini = needsGeminiAssistance(body.message, deterministicFields);

    let mergedFields = mergeFields(previousFields, deterministicFields);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let streamedReply = '';
          let suggestedReplies: string[] = [];
          let currentQuestionField: keyof ExtractedChatFields | null = null;
          let triggerSpaceSelection = false;
          let spaceOptions: string[] = [];
          // STEP 2: Gemini 단일 호출 (추출 + 대화 통합) — 모호한 경우만
          if (shouldUseGemini) {
            try {
              const prompt = buildSystemPrompt(mergedFields, history, body.message);
              const raw = await streamGeminiReply(prompt, apiKey, (chunk) => {
                streamedReply += chunk;
                controller.enqueue(encodeSse('reply', { chunk }));
              });
              const parsed = parseGeminiEnvelope(raw);
              streamedReply = parsed.reply || streamedReply || '조금만 더 쉽게 말씀해 주시면 바로 도와드릴게요 😊';
              suggestedReplies = parsed.options;
              currentQuestionField = parsed.currentQuestionField;
              mergedFields = mergeFields(mergedFields, parsed.fieldUpdates);
            } catch (error) {
              console.error('Gemini 호출 실패:', error);
            }
          }

          // ragContext — 항상 실행 (CSV 조회, ~0ms)
          const ragBundle = await getRagContext(body.message, history, mergedFields);
          mergedFields = mergeFields(ragBundle.fields, mergedFields);
          ragBundle.fields = mergedFields;

          const hasCompletedSelections = hasCompletedSpaceSizes(mergedFields);

          if (mergedFields.pyeong && mergedFields.expansion && (!mergedFields.spaces.length || !hasCompletedSelections)) {
            triggerSpaceSelection = true;
            currentQuestionField = 'spaces';
            spaceOptions = await getSpaceOptions(mergedFields);
            if (!streamedReply) {
              streamedReply = '교체를 원하시는 공간과 각 공간의 창 크기를 함께 선택해 주세요. 체크하면 기본값은 보통 크기로 적용됩니다.';
              controller.enqueue(encodeSse('reply', { chunk: streamedReply }));
            }
          } else if (hasCompletedSelections) {
            triggerSpaceSelection = false;
            spaceOptions = [];
          }

          const quoteLevel = getQuoteLevel(mergedFields);
          const showResult = shouldShowResult(mergedFields);
          const canCalculateQuote = hasCompletedSelections;
          const quoteData = quoteLevel >= 2 && canCalculateQuote ? buildQuoteData(ragBundle, quoteLevel) : null;
          const quickQuoteData = quoteLevel >= 1 && canCalculateQuote ? buildQuickQuoteData(ragBundle, quoteLevel) : null;

          // fallbackCount 추적: Gemini 호출했지만 응답 없으면 +1
          const prevFallbackCount = body.fallbackCount ?? 0;
          const isGeminiFallback = shouldUseGemini && !streamedReply;
          const newFallbackCount = isGeminiFallback ? prevFallbackCount + 1 : prevFallbackCount;
          const consultationNeeded = newFallbackCount >= 2;

          const consumerGroup = classifyConsumer(mergedFields, newFallbackCount);

          // quickQuoteData에 운영자용 메타 주입 (QuoteResult → OperatorReport 전달용)
          if (quickQuoteData) {
            quickQuoteData.data.consultationNeeded = consultationNeeded;
            quickQuoteData.data.fallbackCount = newFallbackCount;
          }
          if (quoteData) {
            quoteData.data.consultationNeeded = consultationNeeded;
            quoteData.data.fallbackCount = newFallbackCount;
          }

          // STEP 1 fast-path: 로컬 응답 (Gemini 미사용 시)
          if (!streamedReply) {
            const local = buildLocalReply(previousFields, mergedFields, officeTelDetected);
            streamedReply = local.reply;
            suggestedReplies = local.options;
            currentQuestionField = local.currentQuestionField;
            // 로컬 응답도 청크로 전송 (UX 일관성)
            controller.enqueue(encodeSse('reply', { chunk: streamedReply }));
          }

          if (!currentQuestionField) {
            currentQuestionField = getNextQuestion(mergedFields)?.key ?? null;
          }

          // 레벨 1 이상 달성 시마다 운영자 데이터 시트에 갱신 저장
          if (quoteLevel >= 1 && quickQuoteData) {
            appendConsultationSheetRow({
              customerName: mergedFields.customerName || '미확인',
              phone: '',
              quoteData: quickQuoteData,
              recommendedBrand: ragBundle.recommendedBrand || 'LX지인',
              consultationNeeded,
              fallbackCount: newFallbackCount,
              consumerGroup,
              quoteLevel,
              extractedFields: mergedFields,
            }).catch(err => console.error('시트 저장 실패:', err));
          }

          const response: ChatApiResponse = {
            reply: streamedReply,
            quoteData,
            quickQuoteData,
            showResult,
            canShowQuickQuote: quoteLevel >= 1 && canCalculateQuote,
            quoteLevel,
            fallbackCount: newFallbackCount,
            sentiment: 'NEUTRAL',
            emphasizeOptions: consultationNeeded,
            suggestedReplies,
            skippedFields: {},
            pendingSkip: null,
            consultationNeeded,
            extractedFields: mergedFields,
            currentQuestionField,
            consumerGroup,
            triggerSpaceSelection,
            spaceOptions,
            triggerSizeSelection: false,
            currentSpace: null,
            sizeOptions: [],
          };

          console.log(`[chat] ${Date.now() - startedAt}ms gemini=${shouldUseGemini}`);
          controller.enqueue(encodeSse('done', response));
          controller.close();
        } catch (error) {
          console.error('chat stream error:', error);
          controller.enqueue(encodeSse('error', { message: '채팅 처리 중 오류가 발생했습니다.' }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '채팅 처리 중 오류가 발생했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
