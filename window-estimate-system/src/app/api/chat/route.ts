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
  CurrentQuestionField,
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
const DIAGNOSIS_PROBLEM_OPTIONS = ['소음', '단열', '결로', '환기'] as const;
const DIAGNOSTIC_KNOWLEDGE = `
[창호 진단 지식DB]
- 연식별 성능
  - 5년 이하: 열관류율 1.0~1.5, 차음 35dB
  - 10년: 열관류율 1.5~2.0, 차음 30dB
  - 20년: 열관류율 2.5~3.0, 차음 25dB
  - 30년 이상: 열관류율 3.0+, 차음 20dB
- 증상별 원인
  - 소음: 유리 두께, 이중창 여부, 창틀 기밀성
  - 단열: 열관류율, 로이유리, 아르곤가스
  - 결로: 실내외 온도차, 기밀성, 단열간봉
  - 환기: 환기창 유무, 미세먼지 차단
- 지역별 난방비 기준
  - 서울/경기: 월 15~25만원 (30평 기준)
  - 지방: 월 10~18만원
- 제품별 성능
  - LX지인 슈퍼이중창: 열관류율 0.9, 차음 42dB
  - KCC 홈씨씨: 열관류율 1.2, 차음 38dB
  - 일반 제품: 열관류율 1.8, 차음 32dB
- 교체 효과
  - 20년 창호에서 LX지인으로 교체 시 난방비 월 1.5만원 절감, 소음 40% 감소, 결로 90% 감소
- 심층질문 세트
  - 소음: 위치, 소음원, 시간대
  - 단열: 방향, 난방비, 결로 여부
  - 환기: 현재 환기창, 미세먼지, 자동환기 관심
  - 결로: 발생 위치, 심각도, 곰팡이 여부
`.trim();

function createEmptyFields(): ExtractedChatFields {
  return {
    customerName: '', housingType: '', pyeong: '', expansion: '',
    spaces: [], spaceSizes: {}, count: '1개', age: '', problem: '', problems: [], diagnosisStep: '', diagnosisDetail: '', timing: '',
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
  const normalizeProblem = (item: string) => {
    if (!item) return '';
    if (item.includes('소음')) return '소음';
    if (item.includes('단열') || item.includes('추위') || item.includes('바람')) return '단열';
    if (item.includes('결로') || item.includes('곰팡이')) return '결로';
    if (item.includes('환기') || item.includes('미세먼지')) return '환기';
    return '';
  };

  if (key === 'spaces') {
    if (!Array.isArray(value)) return [];
    return value.filter(Boolean).map((item) => item === '발코니' ? '거실' : item);
  }
  if (key === 'problems') {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => normalizeProblem(item))
      .filter((item, index, array) => Boolean(item) && array.indexOf(item) === index);
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
  if (key === 'age') {
    const compact = value.replace(/\s/g, '');
    return ['10년이하', '10~20년', '20년이상'].includes(compact) ? compact : '';
  }
  if (key === 'problem') return normalizeProblem(value);
  if (key === 'diagnosisStep') return ['0', '1', '2'].includes(value) ? value : '';
  if (key === 'diagnosisDetail') return value.trim();
  if (key === 'timing') {
    const compact = value.replace(/\s/g, '');
    return ['즉시', '1~3개월', '6개월이후', '미정'].includes(compact) ? compact : '';
  }
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
    case 'problem': return ['소음', '단열', '결로', '환기'];
    case 'diagnosisDetail': return [];
    case 'timing': return ['즉시', '1~3개월', '6개월이후'];
    default: return [];
  }
}

function ensureProblems(fields: ExtractedChatFields) {
  if (fields.problems.length > 0) return fields;
  if (!fields.problem) return fields;
  return {
    ...fields,
    problems: [fields.problem],
  };
}

function getPrimaryProblem(fields: ExtractedChatFields) {
  return fields.problems[0] || fields.problem || '';
}

function getDiagnosisFollowupQuestion(problem: string) {
  switch (problem) {
    case '소음':
      return '주로 어느 공간이 가장 시끄러운가요?';
    case '단열':
      return '난방비가 한 달에 얼마나 나오세요?';
    case '결로':
      return '창틀에도 결로가 생기나요?';
    case '환기':
      return '자동환기에 관심 있으신가요?';
    default:
      return '가장 불편한 상황을 한 가지 더 알려주실 수 있나요?';
  }
}

function getDiagnosisFollowupOptions(problem: string) {
  switch (problem) {
    case '소음':
      return ['거실', '안방', '침실1', '침실2'];
    case '단열':
      return ['10만원 이하', '10~20만원', '20만원 이상'];
    case '결로':
      return ['창틀에도 생겨요', '유리에만 생겨요'];
    case '환기':
      return ['관심 있어요', '아직 없어요'];
    default:
      return [];
  }
}

function buildDiagnosisResult(fields: ExtractedChatFields) {
  const customerName = fields.customerName || '고객';
  const age = fields.age;
  const primaryProblem = getPrimaryProblem(fields);
  const thermal = age === '20년이상' ? '약 3.0' : age === '10~20년' ? '약 2.0' : '약 1.5';
  const savings = age === '20년이상' ? '월 1.5만원' : age === '10~20년' ? '월 1만원' : '월 0.5만원';
  const effectLine =
    primaryProblem === '결로' ? '결로 90% 감소 예상' :
    primaryProblem === '소음' ? '소음 40% 감소 예상' :
    primaryProblem === '환기' ? '환기 성능과 미세먼지 대응 개선 예상' :
    '단열 성능 개선으로 체감 온도와 난방 효율 향상이 예상';

  return `${customerName}님 진단 결과:\n현재 창호 열관류율 ${thermal}\n→ LX지인 교체 시 0.9로 개선\n→ 난방비 ${savings} 절감 예상\n→ ${effectLine}`;
}

function getDiagnosisFlowResponse(fields: ExtractedChatFields) {
  const primaryProblem = getPrimaryProblem(fields);
  const hasDiagnosisTargets = fields.problems.length > 0 || Boolean(primaryProblem);
  if (!hasDiagnosisTargets) {
    return null;
  }

  if (!fields.age) {
    return {
      fields: mergeFields(fields, { diagnosisStep: '0' }),
      reply: `${getPrimaryProblem(fields)} 때문에 불편하셨군요. 현재 창호 연식이 어떻게 되세요?`,
      currentQuestionField: 'diagnosisStep0' as const,
      suggestedReplies: ['10년 이하', '10~20년', '20년 이상'],
    };
  }

  if (!fields.diagnosisDetail) {
    return {
      fields: mergeFields(fields, { diagnosisStep: '1' }),
      reply: getDiagnosisFollowupQuestion(primaryProblem),
      currentQuestionField: 'diagnosisStep1' as const,
      suggestedReplies: getDiagnosisFollowupOptions(primaryProblem),
    };
  }

  if (fields.diagnosisStep !== '2') {
    return {
      fields: mergeFields(fields, { diagnosisStep: '2' }),
      reply: buildDiagnosisResult(fields),
      currentQuestionField: 'diagnosisStep2' as const,
      suggestedReplies: getOptionsForField('timing'),
    };
  }

  return null;
}

function isSelectionCommitMessage(message: string) {
  return message.includes('선택 완료');
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
  const diagnosisState = fields.diagnosisStep ? `현재 진단 단계: ${fields.diagnosisStep}` : '현재 진단 단계: 미진행';
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

[참고 지식DB]
${DIAGNOSTIC_KNOWLEDGE}

[진단 상태]
${diagnosisState}

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
- 진단 설명이나 추천 이유가 필요하면 반드시 위 지식DB 범위 안에서만 말해라
- 소음/단열/결로/환기 상담 시 지식DB의 심층질문 세트를 참고해 한 번에 하나만 질문해라
- 불편사항(problem)이 감지되면 질문 우선순위는 반드시 다음 순서를 따라라
  1. 심층질문으로 원인을 먼저 파악
  2. 지식DB 기반 성능 수치를 짧게 제시
  3. 그 다음에만 제품 추천
- 불편사항 상담 중에는 시공시기 질문을 뒤로 미뤄라
- 결로 상담 예시 흐름
  - "결로가 어느 창에서 주로 생기나요?"
  - "창틀에도 생기나요, 유리에만 생기나요?"
  - "현재 창호가 설치된 지 얼마나 됐나요?"
- 수치 제시는 가능하면 반드시 포함해라
  - 예: "20년 된 창호 기준 열관류율 약 3.0, LX지인 교체 시 0.9로 개선돼 난방비 월 1.5만원 절감이 예상됩니다."
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
      currentQuestionField: null as CurrentQuestionField,
      fieldUpdates: {} as Partial<ExtractedChatFields>,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]) as {
      fieldUpdates?: Partial<ExtractedChatFields>;
      options?: string[];
      currentQuestionField?: CurrentQuestionField;
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
    const previousFields = ensureProblems(mergeFields(createEmptyFields(), body.fields ?? createEmptyFields()));

    // STEP 1: 정규식 fast-path (0ms)
    const deterministicFields = extractDeterministicFields(body.message, history);
    deterministicFields.customerName = ''; // 오탐 방지
    const isCommitMessage = isSelectionCommitMessage(body.message);
    const isDiagnosisDetailMessage = previousFields.diagnosisStep === '1';
    if (isCommitMessage) {
      deterministicFields.spaces = [];
      deterministicFields.problem = '';
      deterministicFields.problems = [];
    }
    if (isDiagnosisDetailMessage) {
      deterministicFields.spaces = [];
      deterministicFields.customerName = '';
    }
    const officeTelDetected = body.message.includes('오피스텔');
    const isDiagnosisFlowMessage = previousFields.diagnosisStep === '0' || previousFields.diagnosisStep === '1';
    const shouldUseGemini = !isDiagnosisFlowMessage && !isCommitMessage && needsGeminiAssistance(body.message, deterministicFields);

    let mergedFields = ensureProblems(mergeFields(previousFields, deterministicFields));

    if (previousFields.diagnosisStep === '1' && !previousFields.diagnosisDetail && body.message.trim()) {
      mergedFields = mergeFields(mergedFields, {
        diagnosisDetail: body.message.trim(),
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let streamedReply = '';
          let suggestedReplies: string[] = [];
          let currentQuestionField: CurrentQuestionField = null;
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
          const normalizedProblemClick = DIAGNOSIS_PROBLEM_OPTIONS.find((item) => body.message.includes(item));
          if (normalizedProblemClick) {
            mergedFields = mergeFields(mergedFields, {
              problem: normalizedProblemClick,
              problems: [normalizedProblemClick],
              diagnosisStep: '0',
            });
            mergedFields.customerName = previousFields.customerName;
          }

          const ragBundle = await getRagContext(body.message, history, mergedFields);
          mergedFields = ensureProblems(mergeFields(ragBundle.fields, mergedFields));
          if (normalizedProblemClick) {
            mergedFields = mergeFields(mergedFields, {
              problem: normalizedProblemClick,
              problems: [normalizedProblemClick],
              diagnosisStep: mergedFields.diagnosisStep || '0',
            });
            mergedFields.customerName = previousFields.customerName;
          }
          if (isDiagnosisDetailMessage) {
            mergedFields = mergeFields(mergedFields, { spaces: previousFields.spaces });
            mergedFields.customerName = previousFields.customerName;
            mergedFields.spaceSizes = previousFields.spaceSizes;
          }
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

          const diagnosisFlow = getDiagnosisFlowResponse(mergedFields);
          if (diagnosisFlow) {
            mergedFields = diagnosisFlow.fields;
            currentQuestionField = diagnosisFlow.currentQuestionField;
            suggestedReplies = diagnosisFlow.suggestedReplies;
            streamedReply = diagnosisFlow.currentQuestionField === 'diagnosisStep2'
              ? `${diagnosisFlow.reply}\n\n언제쯤 시공을 계획하고 계신가요?`
              : diagnosisFlow.reply;
            controller.enqueue(encodeSse('reply', { chunk: streamedReply }));
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
