export type BrandName = 'LX지인' | 'KCC글라스' | '기타' | 'KCC';
export type QuoteLevel = 0 | 1 | 2 | 3;

export type BrandCompareItem = {
  brand: BrandName;
  rawTotal: number;
  marginAmount: number;
  installAmount: number;
  discountAmount: number;
  finalTotal: number;
  isRecommended: boolean;
  productName?: string;
  recommendReason?: string;
};

export type Configuration = {
  config_id: string;
  pyeong: string;
  expansion: string;
  space_name: string;
  space_order: string;
  window_type: string;
  std_width: string;
  std_height: string;
  quantity: number;
  recommend_product_id: string;
};

export type ChatQuoteData = {
  type: 'chat';
  data: {
    space: string;
    count: string;
  };
};

export type AIQuoteData = {
  type: 'ai';
  data: {
    quoteLevel: QuoteLevel;
    errorRange: string;
    skippedCount?: number;
    housingType: string;
    pyeong: string;
    expansion: string;
    space: string;
    count: string;
    age: string;
    problem: string;
    timing: string;
    floor?: string;
    brandPreference?: string;
    priority?: string;
    comparison: BrandCompareItem[];
    recommendedBrand: BrandName;
    recommendedReason?: string;
    heatingSavingAmount?: number;
    heatingSavingText?: string;
    // 운영자 전략 카드용 추가 필드
    consultationNeeded?: boolean;
    fallbackCount?: number;
  };
};

export type SmartLegoQuoteData = {
  type: 'smart-lego' | 'lego';
  data: {
    housingType: string;
    pyeong: string;
    expansion: string;
    configurations?: Configuration[];
  };
};

export type QuoteData = ChatQuoteData | AIQuoteData | SmartLegoQuoteData;

export type QuoteCompleteHandler = (quoteData: QuoteData) => void;

export function isLegoQuoteData(quoteData: QuoteData): quoteData is SmartLegoQuoteData {
  return quoteData.type === 'smart-lego' || quoteData.type === 'lego';
}

export function isAIQuoteData(quoteData: QuoteData): quoteData is AIQuoteData {
  return quoteData.type === 'ai';
}

export type ConsultationCustomer = {
  name: string;
  phone: string;
  address?: string;
  preferredDate?: string;
};

export type ConsultationSubmission = {
  customer: ConsultationCustomer;
  quoteData: QuoteData;
  consultationNeeded?: boolean;
  fallbackCount?: number;
  finalConsulting?: {
    recommendedBrand?: BrandName | string;
  };
};
