export type BrandName = 'LX지인' | 'KCC글라스' | '기타' | 'KCC';

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
    budget: string;
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

export type QuoteData = ChatQuoteData | SmartLegoQuoteData;

export type QuoteCompleteHandler = (quoteData: QuoteData) => void;

export function isLegoQuoteData(quoteData: QuoteData): quoteData is SmartLegoQuoteData {
  return quoteData.type === 'smart-lego' || quoteData.type === 'lego';
}

export type BrandCompareItem = {
  brand: BrandName;
  rawTotal: number;
  marginAmount: number;
  installAmount: number;
  discountAmount: number;
  finalTotal: number;
  isRecommended: boolean;
};

export type ConsultationCustomer = {
  name: string;
  phone: string;
  address?: string;
  preferredDate?: string;
};

export type ConsultationSubmission = {
  customer: ConsultationCustomer;
  quoteData: QuoteData;
  finalConsulting?: {
    recommendedBrand?: BrandName | string;
  };
};
