import { isAIQuoteData, isLegoQuoteData, type BrandCompareItem, type BrandName, type Configuration, type QuoteData } from '@/types/quote';

const BRAND_RULES: Record<BrandName, { baseUnitPrice: number; marginRate: number; installRate: number; discountRate: number }> = {
  'LX지인': { baseUnitPrice: 1050000, marginRate: 0.12, installRate: 0.1, discountRate: 0.02 },
  'KCC글라스': { baseUnitPrice: 900000, marginRate: 0.1, installRate: 0.09, discountRate: 0.01 },
  '기타': { baseUnitPrice: 760000, marginRate: 0.08, installRate: 0.08, discountRate: 0 },
  'KCC': { baseUnitPrice: 900000, marginRate: 0.1, installRate: 0.09, discountRate: 0.01 },
};

const TYPE_WEIGHTS: Record<string, number> = {
  '슬라이딩': 0.95,
  '이중창': 1.1,
  '시스템창호': 1.3,
  '폴딩도어': 1.55,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getWeightedUnits(configurations: Configuration[]) {
  return configurations.reduce((sum, config) => {
    const width = Number.parseInt(config.std_width, 10) || 0;
    const height = Number.parseInt(config.std_height, 10) || 0;
    const quantity = config.quantity || 0;
    const areaFactor = clamp((width * height) / 3_200_000, 0.75, 2.1);
    const typeWeight = TYPE_WEIGHTS[config.window_type] ?? 1;
    return sum + (quantity * areaFactor * typeWeight);
  }, 0);
}

function buildBrandItem(brand: BrandName, weightedUnits: number): BrandCompareItem {
  const rule = BRAND_RULES[brand];
  const rawTotal = Math.round(weightedUnits * rule.baseUnitPrice);
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

export function getDisplayComparison(quoteData: QuoteData): BrandCompareItem[] {
  if (isAIQuoteData(quoteData)) {
    return quoteData.data.comparison;
  }

  if (isLegoQuoteData(quoteData)) {
    const configurations = quoteData.data.configurations ?? [];
    const weightedUnits = Math.max(getWeightedUnits(configurations), 1);
    return [
      buildBrandItem('LX지인', weightedUnits),
      buildBrandItem('KCC글라스', weightedUnits),
      buildBrandItem('기타', weightedUnits),
    ];
  }

  return [
    buildBrandItem('LX지인', 1.8),
    buildBrandItem('KCC글라스', 1.8),
    buildBrandItem('기타', 1.8),
  ];
}

export function getDisplayRecommendedBrand(quoteData: QuoteData) {
  if (isAIQuoteData(quoteData)) {
    return quoteData.data.recommendedBrand;
  }

  return 'LX지인';
}

export function getDisplayRecommendedReason(quoteData: QuoteData) {
  if (isAIQuoteData(quoteData)) {
    return quoteData.data.recommendedReason || '현재 조건 기준으로 단열 성능과 장기 효율이 가장 안정적입니다.';
  }

  return '데모 시뮬레이션 기준으로 단열 성능과 장기 유지비를 함께 고려하면 LX지인이 가장 안정적인 선택입니다.';
}
