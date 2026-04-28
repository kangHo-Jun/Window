import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ChatMessage,
  ExtractedChatFields,
  RagConfigurationRow,
  RagContextBundle,
  RagPriceRow,
  RagProductRow,
  SkipFieldMap,
} from '@/types/chat';
import type { AIQuoteData, BrandCompareItem, BrandName, QuoteLevel } from '@/types/quote';
import { getQuoteErrorLabel, getQuoteLevel } from './quoteLevelEngine';
import { getNextQuestion } from './dynamicQuestion';

export const GEMINI_MODEL = 'gemini-2.5-flash';

const SPACE_KEYWORDS = ['거실', '안방', '침실1', '침실2', '침실', '발코니', '주방', '다용도실', '안방발코니', '앞발코니', '뒷발코니', '전체'] as const;
const CSV_CACHE = new Map<string, Promise<Record<string, string>[]>>();
const AMBIGUOUS_HINTS = ['좀', '약간', '대충', '아마', '오래됐', '넓', '작', '비슷', '애매', '모르', '그냥'] as const;

function getPublicFilePath(fileName: string) {
  return path.join(process.cwd(), 'public', fileName);
}

async function readCsv(fileName: string) {
  if (!CSV_CACHE.has(fileName)) {
    CSV_CACHE.set(fileName, (async () => {
      const raw = await readFile(getPublicFilePath(fileName), 'utf8');
      const lines = raw.trim().split('\n');
      const headers = lines[0].split(',').map((header) => header.trim());

      return lines.slice(1).map((line) => {
        const values = line.split(',').map((value) => value.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
    })());
  }

  return CSV_CACHE.get(fileName)!;
}

function normalizeSpace(space: string) {
  if (!space) return '';
  if (space.includes('침실')) return '침실';
  return space;
}

function normalizePyeongBucket(value: number) {
  if (value <= 25) return '20평대';
  if (value <= 35) return '30평대';
  if (value <= 45) return '40평대';
  return '50평대+';
}

function normalizeAgeBucket(years: number) {
  if (years >= 20) return '20년이상';
  if (years > 10) return '10~20년';
  return '10년이하';
}

function mergeDetectedFields(base: ExtractedChatFields, overrides?: Partial<ExtractedChatFields>) {
  const merged = { ...base };
  if (!overrides) return merged;

  (Object.entries(overrides) as Array<[keyof ExtractedChatFields, string | undefined]>).forEach(([key, value]) => {
    if (value && value !== 'null' && value !== '') {
      merged[key] = value;
    }
  });

  return merged;
}

export function extractDeterministicFields(message: string, history: ChatMessage[]): Partial<ExtractedChatFields> {
  const trimmedMessage = message.trim();
  const historyText = history
    .filter((entry) => entry.role === 'user')
    .map((entry) => entry.content)
    .join(' ');
  const text = `${historyText} ${message}`.trim();
  const lastAssistantMessage = [...history]
    .reverse()
    .find((entry) => entry.role === 'assistant')
    ?.content || '';

  const customerNameMatch =
    trimmedMessage.match(/^(?:저는|전|제 이름은|이름은)\s*([가-힣]{2,5})$/) ||
    trimmedMessage.match(/^([가-힣]{2,5})$/) ||
    text.match(/(?:저는|전|제 이름은|이름은)\s*([가-힣]{2,5})/);

  const pyeongMatch = trimmedMessage.match(/(\d+)\s*평/);
  const barePyeongMatch = trimmedMessage.match(/^(\d{2,3})$/);
  const ageMatch = trimmedMessage.match(/(\d+)\s*년/);
  const matchedSpace = SPACE_KEYWORDS.find((space) => trimmedMessage.includes(space)) || '';
  const countMatch = trimmedMessage.match(/([1-9])\s*개/);
  const problemKeyword = ['단열', '추위', '바람', '소음', '결로', '물방울', '작동', '안열림', '부식', '낡음']
    .find((keyword) => trimmedMessage.includes(keyword)) || '';
  const timingKeyword = ['즉시', '바로', '내일', '이번달', '다음달', '올해', '다음주', '1~3개월', '6개월']
    .find((keyword) => trimmedMessage.includes(keyword)) || '';

  let pyeong = '';
  if (pyeongMatch) {
    pyeong = normalizePyeongBucket(parseInt(pyeongMatch[1], 10));
  } else if (barePyeongMatch && lastAssistantMessage.includes('평형')) {
    pyeong = normalizePyeongBucket(parseInt(barePyeongMatch[1], 10));
  }

  let timing = '';
  if (timingKeyword === '즉시' || timingKeyword === '바로' || timingKeyword === '내일') timing = '즉시';
  else if (timingKeyword === '이번달' || timingKeyword === '다음달' || timingKeyword === '다음주' || timingKeyword === '1~3개월') timing = '1~3개월';
  else if (timingKeyword === '올해' || timingKeyword === '6개월') timing = '6개월이후';

  return {
    customerName: customerNameMatch ? (customerNameMatch[1] || customerNameMatch[0]) : '',
    housingType:
      trimmedMessage.includes('오피스텔') ? '아파트' :
      trimmedMessage.includes('빌라') ? '빌라' :
      trimmedMessage.includes('단독') ? '단독주택' :
      trimmedMessage.includes('아파트') ? '아파트' :
      '',
    pyeong,
    expansion:
      trimmedMessage.includes('비확장') ? '비확장형' :
      trimmedMessage.includes('부분확장') ? '부분확장' :
      trimmedMessage.includes('확장') ? '확장형' :
      '',
    space: matchedSpace,
    count: countMatch ? `${countMatch[1]}개` : '',
    age: ageMatch ? normalizeAgeBucket(parseInt(ageMatch[1], 10)) : '',
    problem:
      problemKeyword === '추위' || problemKeyword === '바람' ? '단열' :
      problemKeyword === '물방울' ? '결로' :
      problemKeyword || '',
    timing,
  };
}

export function needsGeminiAssistance(message: string, detectedFields: Partial<ExtractedChatFields>) {
  const trimmed = message.trim();
  if (!trimmed) return false;

  const hasDetectedField = Object.values(detectedFields).some((value) => Boolean(value));
  if (!hasDetectedField) return true;

  return AMBIGUOUS_HINTS.some((hint) => trimmed.includes(hint));
}

// parseBudgetValue 함수 제거됨 (v2.0 예산 질문 제외)

export function extractChatFields(message: string, history: ChatMessage[]): ExtractedChatFields {
  const detected = extractDeterministicFields(message, history);

  return {
    customerName: detected.customerName || '',
    housingType: detected.housingType || '',
    pyeong: detected.pyeong || '',
    expansion: detected.expansion || '',
    space: detected.space || '',
    count: detected.count || '1개',
    age: detected.age || '',
    problem: detected.problem || '',
    timing: detected.timing || '',
    floor: '',
    corner: '',
    brandPreference: '',
    lifestyle: '',
    noiseSensitive: '',
    priority: '',
  };
}

function toNumber(value: string) {
  return Number.parseInt(value, 10);
}

function buildComparisonItem(brand: BrandName, rawTotal: number): BrandCompareItem {
  const rules = {
    'LX지인': { marginRate: 0.3, installRate: 0.2, discountRate: 0.05 },
    'KCC글라스': { marginRate: 0.25, installRate: 0.18, discountRate: 0.03 },
    '기타': { marginRate: 0.2, installRate: 0.15, discountRate: 0 },
    'KCC': { marginRate: 0.25, installRate: 0.18, discountRate: 0.03 },
  } as const;
  const rule = rules[brand];
  const marginAmount = Math.round(rawTotal * rule.marginRate);
  const installAmount = Math.round(rawTotal * rule.installRate);
  const discountAmount = Math.round(rawTotal * rule.discountRate);

  return {
    brand,
    rawTotal,
    marginAmount,
    installAmount,
    discountAmount,
    finalTotal: rawTotal + marginAmount + installAmount - discountAmount,
    isRecommended: brand === 'LX지인',
  };
}

function chooseRecommendedBrand(comparison: BrandCompareItem[]) {
  return comparison.find((item) => item.brand === 'LX지인')?.brand || comparison[0]?.brand || 'LX지인';
}

export async function getRagContext(message: string, history: ChatMessage[], seedFields?: Partial<ExtractedChatFields>): Promise<RagContextBundle> {
  const fields = mergeDetectedFields(extractChatFields(message, history), seedFields);
  const configurationRows = (await readCsv('db_configurations_v2.csv')) as RagConfigurationRow[];
  const productRows = (await readCsv('db_products_v2.csv')) as RagProductRow[];
  const priceRows = (await readCsv('db_prices_v2.csv')) as RagPriceRow[];

  const matchedConfiguration =
    configurationRows.find((row) =>
      row.pyeong === fields.pyeong &&
      row.expansion === fields.expansion &&
      normalizeSpace(row.space_name) === normalizeSpace(fields.space)
    ) || null;

  const matchedProducts = matchedConfiguration
    ? productRows.filter((row) =>
        row.category === matchedConfiguration.window_type &&
        toNumber(row.width_min) <= toNumber(matchedConfiguration.std_width) &&
        toNumber(row.width_max) >= toNumber(matchedConfiguration.std_width) &&
        toNumber(row.height_min) <= toNumber(matchedConfiguration.std_height) &&
        toNumber(row.height_max) >= toNumber(matchedConfiguration.std_height)
      )
    : [];

  const matchedPrices = matchedConfiguration
    ? priceRows.filter((row) =>
        toNumber(row.width_min) <= toNumber(matchedConfiguration.std_width) &&
        toNumber(row.width_max) >= toNumber(matchedConfiguration.std_width) &&
        toNumber(row.height_min) <= toNumber(matchedConfiguration.std_height) &&
        toNumber(row.height_max) >= toNumber(matchedConfiguration.std_height)
      )
    : [];

  const comparisonBrands: BrandName[] = ['LX지인', 'KCC글라스', '기타'];
  const quantity = Number.parseInt(fields.count.replace(/\D/g, ''), 10) || 1;
  const comparison = comparisonBrands.map((brand) => {
    const matchedProduct = matchedProducts.find((row) => row.brand === brand);
    const matchedPrice = matchedPrices.find((row) => row.brand === brand);
    const rawTotal = (matchedProduct ? toNumber(matchedProduct.price) : matchedPrice ? toNumber(matchedPrice.price) : 0) * quantity;
    return buildComparisonItem(brand, rawTotal || 500000);
  });

  return {
    fields,
    matchedConfiguration,
    matchedProducts: matchedProducts.slice(0, 9),
    matchedPrices: matchedPrices.slice(0, 9),
    comparison,
    recommendedBrand: chooseRecommendedBrand(comparison),
  };
}

export function shouldShowResult(fields: ExtractedChatFields) {
  const isComplete = (val: string) => !!val && val !== 'null' && val !== '';
  
  return (
    isComplete(fields.housingType) && 
    isComplete(fields.pyeong) && 
    isComplete(fields.expansion) && 
    isComplete(fields.space) && 
    isComplete(fields.age) && 
    isComplete(fields.problem) && 
    isComplete(fields.timing)
  );
}

export function canShowQuickQuote(fields: ExtractedChatFields) {
  const isComplete = (val: string) => !!val && val !== 'null' && val !== '';

  return (
    isComplete(fields.housingType) &&
    isComplete(fields.pyeong) &&
    isComplete(fields.expansion)
  );
}

export function buildQuoteData(bundle: RagContextBundle, quoteLevel?: QuoteLevel, skippedFields?: SkipFieldMap): AIQuoteData {
  const resolvedLevel = quoteLevel ?? getQuoteLevel(bundle.fields);
  return {
    type: 'ai',
    data: {
      quoteLevel: resolvedLevel,
      errorRange: getQuoteErrorLabel(resolvedLevel, skippedFields),
      skippedCount: Object.values(skippedFields || {}).filter(Boolean).length,
      housingType: bundle.fields.housingType,
      pyeong: bundle.fields.pyeong,
      expansion: bundle.fields.expansion,
      space: bundle.fields.space,
      count: bundle.fields.count,
      age: bundle.fields.age,
      problem: bundle.fields.problem,
      timing: bundle.fields.timing,
      floor: bundle.fields.floor,
      brandPreference: bundle.fields.brandPreference,
      priority: bundle.fields.priority,
      comparison: bundle.comparison,
      recommendedBrand: bundle.recommendedBrand,
    },
  };
}

export function buildQuickQuoteData(bundle: RagContextBundle, quoteLevel?: QuoteLevel, skippedFields?: SkipFieldMap): AIQuoteData {
  const resolvedLevel = quoteLevel ?? getQuoteLevel(bundle.fields);
  return {
    type: 'ai',
    data: {
      quoteLevel: resolvedLevel,
      errorRange: getQuoteErrorLabel(resolvedLevel, skippedFields),
      skippedCount: Object.values(skippedFields || {}).filter(Boolean).length,
      housingType: bundle.fields.housingType,
      pyeong: bundle.fields.pyeong,
      expansion: bundle.fields.expansion,
      space: bundle.fields.space || '미정',
      count: bundle.fields.count || '1개',
      age: bundle.fields.age || '미정',
      problem: bundle.fields.problem || '미정',
      timing: bundle.fields.timing || '미정',
      floor: bundle.fields.floor || '미정',
      brandPreference: bundle.fields.brandPreference || '미정',
      priority: bundle.fields.priority || '미정',
      comparison: bundle.comparison,
      recommendedBrand: bundle.recommendedBrand,
    },
  };
}

function buildConfigSummary(bundle: RagContextBundle) {
  if (!bundle.matchedConfiguration) {
    return '일치하는 표준 구성은 아직 찾지 못했습니다.';
  }

  return [
    `표준공간: ${bundle.matchedConfiguration.space_name}`,
    `창호유형: ${bundle.matchedConfiguration.window_type}`,
    `표준사이즈: ${bundle.matchedConfiguration.std_width}x${bundle.matchedConfiguration.std_height}`,
    `추천제품ID: ${bundle.matchedConfiguration.recommend_product_id}`,
  ].join(' | ');
}

export function buildRagPrompt(bundle: RagContextBundle, history: ChatMessage[], showResult: boolean) {
  const historySummary = history.slice(-5).map((entry) => `${entry.role === 'user' ? '고객' : '상담원'}: ${entry.content}`).join('\n');
  const productSummary = bundle.matchedProducts
    .slice(0, 6)
    .map((row) => `${row.brand} / ${row.product_name} / ${row.category} / ${row.energy_grade} / ${row.price}원`)
    .join('\n');
  const priceSummary = bundle.matchedPrices
    .slice(0, 6)
    .map((row) => `${row.brand} / ${row.width_min}-${row.width_max} / ${row.height_min}-${row.height_max} / ${row.price}원`)
    .join('\n');
  const comparisonSummary = bundle.comparison
    .map((item) => `${item.brand}: ${item.finalTotal.toLocaleString()}원`)
    .join(', ');

    const nextQuestion = getNextQuestion(bundle.fields);

  return `
역할:
- 당신은 LX지인 창호 대리점의 한국어 AI 상담원 "지인"이다.
- 친근하고 따뜻한 어조로 말하되, 전문성을 잃지 않는다.
- 반드시 아래 RAG 정보와 추출된 상태를 기반으로 대화한다.

현재 추출된 정보 상태:
- 주거형태: ${bundle.fields.housingType || '미정'}
- 평형: ${bundle.fields.pyeong ? bundle.fields.pyeong + '평' : '미정'}
- 확장형태: ${bundle.fields.expansion || '미정'}
- 공간: ${bundle.fields.space || '미정'}
- 창 개수: ${bundle.fields.count || '미정'}
- 노후도: ${bundle.fields.age || '미정'}
- 불편사항: ${bundle.fields.problem || '미정'}
- 시공시기: ${bundle.fields.timing || '미정'}

상태 정보 가이드:
- 정보가 "미정"인 항목이 있다면 자연스럽게 질문하여 정보를 수집해야 함.
- 현재 가장 우선순위가 높은 질문: ${nextQuestion ? nextQuestion.question : '모든 기본 정보 수집 완료'}

표준 구성:
${buildConfigSummary(bundle)}

관련 제품:
${productSummary || '없음'}

관련 가격 구간:
${priceSummary || '없음'}

최근 대화:
${historySummary || '없음'}

예상 비교 견적:
${comparisonSummary}

응답 규칙:
- 한국어 3문장 이내
- showResult=${showResult ? 'true' : 'false'}
- showResult가 false면 ${nextQuestion ? nextQuestion.label : '다음 단계'}에 대해 질문
- 이미 수집된 정보(${Object.entries(bundle.fields).filter(([_, v]) => !!v && v !== 'null').map(([k, _]) => k).join(', ')})는 절대 다시 묻지 말 것
- showResult가 true면 3사 비교를 짧게 요약하고 LX지인 추천 이유를 한 문장 포함
- JSON, 코드블록, 마크다운 표 금지
`.trim();
}

export function buildFallbackReply(bundle: RagContextBundle, showResult: boolean) {
  if (!bundle.fields.pyeong) {
    return '몇 평대 아파트인지 알려주시면 표준 구성 기준으로 바로 가견적을 잡아드릴게요.';
  }
  if (!bundle.fields.space) {
    return '어느 공간 창호를 교체하실지 알려주세요. 예를 들면 거실, 안방, 발코니처럼 말씀하시면 됩니다.';
  }
  if (!bundle.fields.expansion) {
    return '확장형인가요, 아니면 비확장형인가요?';
  }
  if (!showResult) {
    const next = getNextQuestion(bundle.fields);
    return next ? next.question : '추가 정보를 알려주시면 더 정확한 견적이 가능합니다.';
  }

  const summary = bundle.comparison
    .map((item) => `${item.brand} ${item.finalTotal.toLocaleString()}원`)
    .join(', ');

  return `${bundle.fields.pyeong}평 ${bundle.fields.space} ${bundle.fields.expansion} 기준 가견적입니다. ${summary} 정도로 보시면 되고, 단열과 장기 효율 기준으로는 LX지인을 가장 추천드립니다.`;
}
