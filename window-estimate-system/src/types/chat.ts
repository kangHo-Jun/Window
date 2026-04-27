import type { AIQuoteData, BrandCompareItem } from '@/types/quote';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequest = {
  message: string;
  history: ChatMessage[];
};

export type ExtractedChatFields = {
  housingType: string;
  pyeong: string;
  expansion: string;
  space: string;
  budget: string;
  budgetValue: number | null;
  count: string;
};

export type RagConfigurationRow = {
  config_id: string;
  pyeong: string;
  expansion: string;
  space_name: string;
  space_order: string;
  window_type: string;
  std_width: string;
  std_height: string;
  quantity: string;
  recommend_product_id: string;
  note?: string;
};

export type RagProductRow = {
  product_id: string;
  product_name: string;
  category: string;
  description: string;
  brand: string;
  energy_grade: string;
  warranty_year: string;
  width_min: string;
  width_max: string;
  height_min: string;
  height_max: string;
  price: string;
};

export type RagPriceRow = {
  product_id: string;
  brand: string;
  width_min: string;
  width_max: string;
  height_min: string;
  height_max: string;
  price: string;
};

export type RagContextBundle = {
  fields: ExtractedChatFields;
  matchedConfiguration: RagConfigurationRow | null;
  matchedProducts: RagProductRow[];
  matchedPrices: RagPriceRow[];
  comparison: BrandCompareItem[];
  recommendedBrand: BrandCompareItem['brand'];
};

export type ChatApiResponse = {
  reply: string;
  quoteData: AIQuoteData | null;
  showResult: boolean;
};
