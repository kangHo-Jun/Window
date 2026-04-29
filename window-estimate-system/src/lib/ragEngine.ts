import type {
  ChatMessage,
  ExtractedChatFields,
  RagConfigurationRow,
  RagContextBundle,
  RagPreferenceRuleRow,
  RagPriceRow,
  RagProductRow,
  RagSpaceSizeRow,
  SkipFieldMap,
} from '@/types/chat';
import type { AIQuoteData, BrandCompareItem, BrandName, QuoteLevel } from '@/types/quote';
import { getQuoteErrorLabel, getQuoteLevel } from './quoteLevelEngine';
import { getNextQuestion } from './dynamicQuestion';
import { loadConfigurationRows, loadPreferenceRuleRows, loadPriceRows, loadProductRows, loadSpaceSizeRows } from './dbLoader';

export const GEMINI_MODEL = 'gemini-2.5-flash';

const SPACE_KEYWORDS = ['거실', '안방', '침실1', '침실2', '침실', '발코니', '주방', '다용도실', '안방발코니', '앞발코니', '뒷발코니', '전체'] as const;
const AMBIGUOUS_HINTS = ['좀', '약간', '대충', '아마', '오래됐', '넓', '작', '비슷', '애매', '모르', '그냥'] as const;
const PREFERENCE_HINTS = ['단열', '소음', '환기', '결로', '뷰', '조망'] as const;
const RECOMMENDATION_HINTS = ['추천', '어떤게', '뭐가 좋'] as const;
const DISCOMFORT_HINTS = ['춥다', '덥다', '시끄럽다', '결로', '바람', '추위', '소음'] as const;
const SIMPLE_SELECTIONS = [
  '아파트', '빌라', '단독주택', '단독', '오피스텔',
  '확장형', '비확장형', '부분확장',
  '거실', '안방', '발코니', '침실', '전체',
  '예', '아니오', '네', '아니요',
] as const;

function normalizeSpace(space: string) {
  if (!space) return '';
  if (space === '발코니' || space === '안방발코니' || space === '앞발코니' || space === '뒷발코니') return '거실';
  if (space === '침실') return '침실1';
  return space;
}

function normalizePyeongBucket(value: number) {
  if (value <= 25) return '20평대';
  if (value <= 35) return '30평대';
  if (value <= 45) return '40평대';
  return '50평대+';
}

export function normalizePyeongValue(value: string) {
  if (!value) return '';
  if (value.includes('평대')) return value;
  const digits = Number.parseInt(value.replace(/\D/g, ''), 10);
  if (Number.isNaN(digits)) return value;
  return normalizePyeongBucket(digits);
}

function normalizeAgeBucket(years: number) {
  if (years >= 20) return '20년이상';
  if (years > 10) return '10~20년';
  return '10년이하';
}

function mergeDetectedFields(base: ExtractedChatFields, overrides?: Partial<ExtractedChatFields>) {
  const merged = { ...base };
  if (!overrides) return merged;

  (Object.entries(overrides) as Array<[
    keyof ExtractedChatFields,
    string | string[] | Record<string, '소' | '중' | '대' | '모름'> | undefined
  ]>).forEach(([key, value]) => {
    if (key === 'spaces' && Array.isArray(value)) {
      merged.spaces = value.filter(Boolean).map(normalizeSpace);
      return;
    }

    if (key === 'spaceSizes' && value && typeof value === 'object' && !Array.isArray(value)) {
      merged.spaceSizes = {
        ...merged.spaceSizes,
        ...Object.fromEntries(
          Object.entries(value)
            .filter(([, size]) => ['소', '중', '대', '모름'].includes(size))
            .map(([space, size]) => [normalizeSpace(space), size]),
        ),
      };
      return;
    }

    if (typeof value === 'string' && value && value !== 'null' && value !== '') {
      merged[key] = value as never;
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
    spaces: matchedSpace ? [normalizeSpace(matchedSpace)] : [],
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

  const normalized = trimmed.replace(/\s+/g, ' ').trim();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  const isSimplePyeongInput = /^(\d+\s*평대?|\d+\s*평)$/.test(normalized);
  const isSimpleNumericInput = /^\d+$/.test(normalized);
  const isSimpleNameInput =
    /^(?:저는|전|제 이름은|이름은)\s*[가-힣]{2,5}$/.test(normalized) ||
    /^[가-힣]{2,5}$/.test(normalized);
  const isSimpleYesNo = /^(예|아니오|네|아니요)$/.test(normalized);
  const isSimpleSelection = SIMPLE_SELECTIONS.includes(normalized as typeof SIMPLE_SELECTIONS[number]);

  if (isSimplePyeongInput || isSimpleNumericInput || isSimpleNameInput || isSimpleYesNo || isSimpleSelection) {
    return false;
  }

  if (PREFERENCE_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  if (AMBIGUOUS_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  if (RECOMMENDATION_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  if (DISCOMFORT_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  if (wordCount >= 5) {
    return true;
  }

  const hasDetectedField = Object.values(detectedFields).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
  if (!hasDetectedField) return true;

  return false;
}

// parseBudgetValue 함수 제거됨 (v2.0 예산 질문 제외)

export function extractChatFields(message: string, history: ChatMessage[]): ExtractedChatFields {
  const detected = extractDeterministicFields(message, history);

  return {
    customerName: detected.customerName || '',
    housingType: detected.housingType || '',
    pyeong: detected.pyeong || '',
    expansion: detected.expansion || '',
    spaces: detected.spaces || [],
    spaceSizes: {},
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

function getBrandScore(rule: RagPreferenceRuleRow | null, brand: BrandName) {
  if (!rule) return 0;
  if (brand === 'LX지인') return Number.parseInt(rule.lx_score || '0', 10);
  if (brand === 'KCC글라스' || brand === 'KCC') return Number.parseInt(rule.kcc_score || '0', 10);
  return Number.parseInt(rule.etc_score || '0', 10);
}

function getPreferenceRule(fields: ExtractedChatFields, message: string, rules: RagPreferenceRuleRow[]) {
  const source = [fields.problem, fields.priority, message]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return rules.find((rule) =>
    rule.trigger_keywords
      .split('|')
      .map((keyword) => keyword.trim().toLowerCase())
      .some((keyword) => keyword && source.includes(keyword)),
  ) || null;
}

function getHeatingSavingRate(age: string) {
  if (age === '20년이상') return 0.32;
  if (age === '10~20년') return 0.22;
  return 0.12;
}

function getPyeongHeatingBase(pyeong: string) {
  if (pyeong === '20평대') return 480000;
  if (pyeong === '40평대') return 680000;
  if (pyeong === '50평대+') return 820000;
  return 560000;
}

function buildHeatingSaving(fields: ExtractedChatFields) {
  const amount = Math.round(getPyeongHeatingBase(fields.pyeong) * getHeatingSavingRate(fields.age || '10년이하'));
  const ageLabel = fields.age === '20년이상' ? '20년 이상 된' : fields.age === '10~20년' ? '10~20년 된' : '10년 이하';
  const pyeongLabel = fields.pyeong || '30평대';
  return {
    amount,
    text: `${ageLabel} ${pyeongLabel} 기준 연 ${Math.round(amount / 10000)}만원 절감 예상`,
  };
}

function resolveSpaceSizeErrorRange(fields: ExtractedChatFields, fallbackLabel: string) {
  if (fields.spaces.length === 0) return fallbackLabel;
  const selections = fields.spaces.map((space) => fields.spaceSizes[space]).filter(Boolean);
  if (selections.length !== fields.spaces.length) return fallbackLabel;
  return selections.includes('모름') ? '±20%' : '±10%';
}

function applySpaceSize(configuration: RagConfigurationRow, fields: ExtractedChatFields, sizeRows: RagSpaceSizeRow[]) {
  const selected = fields.spaceSizes[configuration.space_name];
  if (!selected || selected === '모름' || selected === '중') {
    return configuration;
  }

  const sizeRow = sizeRows.find((row) => row.space_name === configuration.space_name && row.size_code === selected);
  if (!sizeRow) return configuration;

  const width = Math.round(toNumber(configuration.std_width) * Number.parseFloat(sizeRow.width_factor || '1'));
  const height = Math.round(toNumber(configuration.std_height) * Number.parseFloat(sizeRow.height_factor || '1'));

  return {
    ...configuration,
    std_width: String(width),
    std_height: String(height),
  };
}

export async function getRagContext(message: string, history: ChatMessage[], seedFields?: Partial<ExtractedChatFields>): Promise<RagContextBundle> {
  const fields = mergeDetectedFields(extractChatFields(message, history), seedFields);
  const [configurationRows, productRows, priceRows, spaceSizeRows, preferenceRuleRows] = await Promise.all([
    loadConfigurationRows(),
    loadProductRows(),
    loadPriceRows(),
    loadSpaceSizeRows(),
    loadPreferenceRuleRows(),
  ]);

  const selectedSpaces = fields.spaces.map(normalizeSpace);
  const matchedConfigurations = configurationRows.filter((row) =>
      normalizePyeongValue(row.pyeong) === normalizePyeongValue(fields.pyeong) &&
      row.expansion === fields.expansion &&
      selectedSpaces.includes(normalizeSpace(row.space_name))
  ).map((row) => applySpaceSize(row, fields, spaceSizeRows));
  const matchedConfiguration = matchedConfigurations[0] || null;

  const matchedProducts = matchedConfigurations.flatMap((configuration) =>
    productRows
      .filter((row) =>
        row.category === configuration.window_type &&
        toNumber(row.width_min) <= toNumber(configuration.std_width) &&
        toNumber(row.width_max) >= toNumber(configuration.std_width) &&
        toNumber(row.height_min) <= toNumber(configuration.std_height) &&
        toNumber(row.height_max) >= toNumber(configuration.std_height)
      )
      .sort((left, right) => {
        const recommendedId = configuration.recommend_product_id;
        const leftScore = left.product_id.startsWith(recommendedId) ? 1 : 0;
        const rightScore = right.product_id.startsWith(recommendedId) ? 1 : 0;
        return rightScore - leftScore;
      })
  );

  const matchedPrices = matchedConfigurations.flatMap((configuration) =>
    priceRows.filter((row) =>
      toNumber(row.width_min) <= toNumber(configuration.std_width) &&
      toNumber(row.width_max) >= toNumber(configuration.std_width) &&
      toNumber(row.height_min) <= toNumber(configuration.std_height) &&
      toNumber(row.height_max) >= toNumber(configuration.std_height)
    )
  );

  const activePreferenceRule = getPreferenceRule(fields, message, preferenceRuleRows);

  const comparisonBrands: BrandName[] = ['LX지인', 'KCC글라스', '기타'];
  const quantity = Number.parseInt(fields.count.replace(/\D/g, ''), 10) || 1;
  const comparison = comparisonBrands.map((brand) => {
    const brandProducts = matchedProducts.filter((row) => row.brand === brand);
    const preferredProduct = brandProducts.find((row) =>
      !activePreferenceRule ||
      !activePreferenceRule.preferred_category ||
      row.category === activePreferenceRule.preferred_category ||
      row.description.includes(activePreferenceRule.preferred_category),
    ) || brandProducts[0];

    const rawTotal = matchedConfigurations.reduce((sum, configuration) => {
      const matchedProduct = productRows.find((row) =>
        row.brand === brand &&
        row.category === configuration.window_type &&
        toNumber(row.width_min) <= toNumber(configuration.std_width) &&
        toNumber(row.width_max) >= toNumber(configuration.std_width) &&
        toNumber(row.height_min) <= toNumber(configuration.std_height) &&
        toNumber(row.height_max) >= toNumber(configuration.std_height)
      );
      const matchedPrice = priceRows.find((row) =>
        row.brand === brand &&
        toNumber(row.width_min) <= toNumber(configuration.std_width) &&
        toNumber(row.width_max) >= toNumber(configuration.std_width) &&
        toNumber(row.height_min) <= toNumber(configuration.std_height) &&
        toNumber(row.height_max) >= toNumber(configuration.std_height)
      );
      const price = matchedProduct ? toNumber(matchedProduct.price) : matchedPrice ? toNumber(matchedPrice.price) : 500000;
      return sum + (price * quantity);
    }, 0);
    const item = buildComparisonItem(brand, rawTotal || 500000);
    item.productName = preferredProduct?.product_name || '';
    return item;
  });

  const recommendedBrand = activePreferenceRule
    ? [...comparison].sort((left, right) => {
        const scoreDiff = getBrandScore(activePreferenceRule, right.brand) - getBrandScore(activePreferenceRule, left.brand);
        if (scoreDiff !== 0) return scoreDiff;
        return left.finalTotal - right.finalTotal;
      })[0]?.brand || chooseRecommendedBrand(comparison)
    : chooseRecommendedBrand(comparison);

  const recommendedReason = activePreferenceRule?.recommend_reason
    || `${fields.problem || '현재 조건'} 기준으로는 장기 효율과 성능 안정성이 높은 ${recommendedBrand} 쪽이 더 잘 맞아요.`;

  const heatingSaving = buildHeatingSaving(fields);
  const comparisonWithReasons = comparison.map((item) => ({
    ...item,
    isRecommended: item.brand === recommendedBrand,
    recommendReason: item.brand === recommendedBrand ? recommendedReason : '',
  }));

  return {
    fields,
    matchedConfiguration,
    matchedProducts: matchedProducts.slice(0, 9),
    matchedPrices: matchedPrices.slice(0, 9),
    comparison: comparisonWithReasons,
    recommendedBrand,
    recommendedReason,
    heatingSavingAmount: heatingSaving.amount,
    heatingSavingText: heatingSaving.text,
  };
}

export function shouldShowResult(fields: ExtractedChatFields) {
  const isComplete = (val: string) => !!val && val !== 'null' && val !== '';
  
  return (
    isComplete(fields.housingType) && 
    isComplete(fields.pyeong) && 
    isComplete(fields.expansion) && 
    fields.spaces.length > 0 && 
    isComplete(fields.age) && 
    isComplete(fields.problem) && 
    isComplete(fields.timing)
  );
}

export function canShowQuickQuote(fields: ExtractedChatFields) {
  const isComplete = (val: string) => !!val && val !== 'null' && val !== '';
  const hasCompletedSpaceSizes =
    fields.spaces.length > 0 &&
    fields.spaces.every((space) => Boolean(fields.spaceSizes[space]));

  return (
    isComplete(fields.housingType) &&
    isComplete(fields.pyeong) &&
    isComplete(fields.expansion) &&
    hasCompletedSpaceSizes
  );
}

export function buildQuoteData(bundle: RagContextBundle, quoteLevel?: QuoteLevel, skippedFields?: SkipFieldMap): AIQuoteData {
  const resolvedLevel = quoteLevel ?? getQuoteLevel(bundle.fields);
  return {
    type: 'ai',
    data: {
      quoteLevel: resolvedLevel,
      errorRange: resolveSpaceSizeErrorRange(bundle.fields, getQuoteErrorLabel(resolvedLevel, skippedFields)),
      skippedCount: Object.values(skippedFields || {}).filter(Boolean).length,
      housingType: bundle.fields.housingType,
      pyeong: bundle.fields.pyeong,
      expansion: bundle.fields.expansion,
      space: bundle.fields.spaces.join(', '),
      count: bundle.fields.count,
      age: bundle.fields.age,
      problem: bundle.fields.problem,
      timing: bundle.fields.timing,
      floor: bundle.fields.floor,
      brandPreference: bundle.fields.brandPreference,
      priority: bundle.fields.priority,
      comparison: bundle.comparison,
      recommendedBrand: bundle.recommendedBrand,
      recommendedReason: bundle.recommendedReason,
      heatingSavingAmount: bundle.heatingSavingAmount,
      heatingSavingText: bundle.heatingSavingText,
    },
  };
}

export function buildQuickQuoteData(bundle: RagContextBundle, quoteLevel?: QuoteLevel, skippedFields?: SkipFieldMap): AIQuoteData {
  const resolvedLevel = quoteLevel ?? getQuoteLevel(bundle.fields);
  return {
    type: 'ai',
    data: {
      quoteLevel: resolvedLevel,
      errorRange: resolveSpaceSizeErrorRange(bundle.fields, getQuoteErrorLabel(resolvedLevel, skippedFields)),
      skippedCount: Object.values(skippedFields || {}).filter(Boolean).length,
      housingType: bundle.fields.housingType,
      pyeong: bundle.fields.pyeong,
      expansion: bundle.fields.expansion,
      space: bundle.fields.spaces.join(', ') || '미정',
      count: bundle.fields.count || '1개',
      age: bundle.fields.age || '미정',
      problem: bundle.fields.problem || '미정',
      timing: bundle.fields.timing || '미정',
      floor: bundle.fields.floor || '미정',
      brandPreference: bundle.fields.brandPreference || '미정',
      priority: bundle.fields.priority || '미정',
      comparison: bundle.comparison,
      recommendedBrand: bundle.recommendedBrand,
      recommendedReason: bundle.recommendedReason,
      heatingSavingAmount: bundle.heatingSavingAmount,
      heatingSavingText: bundle.heatingSavingText,
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
- 공간: ${bundle.fields.spaces.join(', ') || '미정'}
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

추천 포인트:
${bundle.recommendedReason}

난방비 절감 예상:
${bundle.heatingSavingText}

응답 규칙:
- 한국어 3문장 이내
- showResult=${showResult ? 'true' : 'false'}
- showResult가 false면 ${nextQuestion ? nextQuestion.label : '다음 단계'}에 대해 질문
- 이미 수집된 정보(${Object.entries(bundle.fields).filter(([_, v]) => !!v && v !== 'null').map(([k, _]) => k).join(', ')})는 절대 다시 묻지 말 것
- 불편사항이나 우선순위가 이미 있으면 "아까 ${bundle.fields.problem || bundle.fields.priority} 때문이라고 하셨잖아요"처럼 맥락을 자연스럽게 이어라
- showResult가 true면 3사 비교를 짧게 요약하고 LX지인 추천 이유를 한 문장 포함
- JSON, 코드블록, 마크다운 표 금지
`.trim();
}

export function buildFallbackReply(bundle: RagContextBundle, showResult: boolean) {
  if (!bundle.fields.pyeong) {
    return '몇 평대 아파트인지 알려주시면 표준 구성 기준으로 바로 가견적을 잡아드릴게요.';
  }
  if (bundle.fields.spaces.length === 0) {
    return '교체를 원하시는 공간을 먼저 선택해 주세요. 거실, 안방, 침실, 주방처럼 여러 개도 가능합니다.';
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

  return `${bundle.fields.pyeong}평 ${bundle.fields.spaces.join(', ')} ${bundle.fields.expansion} 기준 가견적입니다. ${summary} 정도로 보시면 되고, 단열과 장기 효율 기준으로는 LX지인을 가장 추천드립니다.`;
}
