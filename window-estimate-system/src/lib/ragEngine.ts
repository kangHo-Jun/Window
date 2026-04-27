import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ChatMessage,
  ExtractedChatFields,
  RagConfigurationRow,
  RagContextBundle,
  RagPriceRow,
  RagProductRow,
} from '@/types/chat';
import type { AIQuoteData, BrandCompareItem, BrandName } from '@/types/quote';

export const GEMINI_MODEL = 'gemini-2.0-flash';

const SPACE_KEYWORDS = ['거실', '안방', '침실1', '침실2', '침실', '발코니', '주방', '다용도실', '안방발코니', '앞발코니', '뒷발코니', '전체'] as const;
const CSV_CACHE = new Map<string, Promise<Record<string, string>[]>>();

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

function parseBudgetValue(text: string) {
  const millionMatch = text.match(/(\d{2,4})\s*만\s*원?/);
  if (millionMatch) {
    return Number.parseInt(millionMatch[1], 10) * 10000;
  }

  const plainMatch = text.match(/(\d{6,8})\s*원?/);
  if (plainMatch) {
    return Number.parseInt(plainMatch[1], 10);
  }

  return null;
}

export function extractChatFields(message: string, history: ChatMessage[]): ExtractedChatFields {
  const userHistory = history
    .filter((entry) => entry.role === 'user')
    .map((entry) => entry.content)
    .join(' ');
  const text = `${userHistory} ${message}`;

  const pyeongMatch = text.match(/(20|30|40|50)\s*평/);
  const expansion =
    text.includes('비확장') ? '비확장형' :
    text.includes('확장') ? '확장형' :
    '';
  const housingType =
    text.includes('빌라') ? '빌라' :
    text.includes('단독') ? '단독주택' :
    text.includes('아파트') ? '아파트' :
    '아파트';

  const matchedSpace = SPACE_KEYWORDS.find((space) => text.includes(space)) || '';
  const countMatch = text.match(/([1-9])\s*개/);
  const budgetValue = parseBudgetValue(text);
  const budget = budgetValue ? `${Math.round(budgetValue / 10000)}만 원` : '';

  return {
    housingType,
    pyeong: pyeongMatch?.[1] || '',
    expansion,
    space: matchedSpace,
    budget,
    budgetValue,
    count: countMatch ? `${countMatch[1]}개` : '1개',
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

export async function getRagContext(message: string, history: ChatMessage[]): Promise<RagContextBundle> {
  const fields = extractChatFields(message, history);
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
  return Boolean(fields.pyeong && fields.expansion && fields.space);
}

export function buildQuoteData(bundle: RagContextBundle): AIQuoteData {
  return {
    type: 'ai',
    data: {
      housingType: bundle.fields.housingType,
      pyeong: bundle.fields.pyeong,
      expansion: bundle.fields.expansion,
      space: bundle.fields.space,
      budget: bundle.fields.budget || '미정',
      count: bundle.fields.count,
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

  return `
역할:
- 당신은 LX지인 창호 대리점의 한국어 AI 상담원이다.
- 친근하지만 짧고 전문적으로 말한다.
- 반드시 아래 RAG 정보만 사용한다.

현재 추출 정보:
- 주거형태: ${bundle.fields.housingType || '미정'}
- 평형: ${bundle.fields.pyeong || '미정'}
- 확장형태: ${bundle.fields.expansion || '미정'}
- 공간: ${bundle.fields.space || '미정'}
- 예산: ${bundle.fields.budget || '미정'}
- 창 개수: ${bundle.fields.count || '미정'}

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
- showResult가 false면 가장 필요한 정보 1개만 추가로 질문
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
    return `${bundle.fields.pyeong}평 ${bundle.fields.space} 기준으로 보고 있습니다. 확장형인지 비확장형인지 알려주세요.`;
  }
  if (!showResult) {
    return '예산도 함께 알려주시면 더 정확한 추천이 가능합니다.';
  }

  const summary = bundle.comparison
    .map((item) => `${item.brand} ${item.finalTotal.toLocaleString()}원`)
    .join(', ');

  return `${bundle.fields.pyeong}평 ${bundle.fields.space} ${bundle.fields.expansion} 기준 가견적입니다. ${summary} 정도로 보시면 되고, 단열과 장기 효율 기준으로는 LX지인을 가장 추천드립니다.`;
}
