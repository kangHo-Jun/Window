import type { AIQuoteData, BrandCompareItem, QuoteLevel } from '@/types/quote';

export type ConsumerGroup =
  | '가성비형'
  | '프리미엄형'
  | '정보수집형'
  | '긴급형'
  | '대규모형'
  | 'UNKNOWN';

export type ConsumerGroupInfo = {
  group: ConsumerGroup;
  emoji: string;
  label: string;
  recommendBrand: string;
  hint: string;
};

export type ChatRole = 'user' | 'assistant';
export type SentimentType = 'FRUSTRATED' | 'CONFUSED' | 'IMPATIENT' | 'SATISFIED' | 'NEUTRAL';
export type SkipFieldMap = Partial<Record<keyof ExtractedChatFields, boolean>>;
export type PendingSkip = {
  field: keyof ExtractedChatFields;
  value: string;
  kind: 'core' | 'sub';
};

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequest = {
  message: string;
  history: ChatMessage[];
  fields?: ExtractedChatFields;
  fallbackCount?: number;
  skippedFields?: SkipFieldMap;
  pendingSkip?: PendingSkip | null;
};

export type ExtractedChatFields = {
  customerName: string;
  housingType: string;
  pyeong: string;
  expansion: string;
  space: string;
  count: string;
  age: string;      
  problem: string;  
  timing: string;   
  
  // 2단계 (Deep)
  floor: string;
  corner: string;
  brandPreference: string;

  // 3단계 (Deeper)
  lifestyle: string;
  noiseSensitive: string;
  priority: string;
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
  quickQuoteData: AIQuoteData | null;
  showResult: boolean;
  canShowQuickQuote: boolean;
  quoteLevel: QuoteLevel;
  fallbackCount: number;
  sentiment: SentimentType;
  emphasizeOptions: boolean;
  suggestedReplies: string[];
  skippedFields: SkipFieldMap;
  pendingSkip: PendingSkip | null;
  consultationNeeded: boolean;
  extractedFields: ExtractedChatFields;
  currentQuestionField: keyof ExtractedChatFields | null;
  consumerGroup: ConsumerGroupInfo;
};
