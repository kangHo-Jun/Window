import type { ConsumerGroup, ConsumerGroupInfo, ExtractedChatFields } from '@/types/chat';

const GROUP_INFO: Record<ConsumerGroup, ConsumerGroupInfo> = {
  '가성비형':   { group: '가성비형',   emoji: '💰', label: '가성비형',   recommendBrand: '기타',    hint: '합리적인 가격으로 최대 성능을' },
  '프리미엄형': { group: '프리미엄형', emoji: '🏆', label: '프리미엄형', recommendBrand: 'LX지인',  hint: '최고 품질과 장기 가치를' },
  '정보수집형': { group: '정보수집형', emoji: '🤔', label: '정보수집형', recommendBrand: 'LX지인',  hint: '충분한 비교 후 결정을' },
  '긴급형':     { group: '긴급형',     emoji: '⚡', label: '긴급형',     recommendBrand: 'LX지인',  hint: '빠른 시공을' },
  '대규모형':   { group: '대규모형',   emoji: '🏠', label: '대규모형',   recommendBrand: 'LX지인',  hint: '전문 패키지 견적을' },
  'UNKNOWN':    { group: 'UNKNOWN',    emoji: '🔍', label: '미분류',     recommendBrand: 'LX지인',  hint: '맞춤 견적을' },
};

export function classifyConsumer(fields: ExtractedChatFields, fallbackCount = 0): ConsumerGroupInfo {
  if (fields.timing === '즉시') return GROUP_INFO['긴급형'];

  if (fields.pyeong === '50평대+') return GROUP_INFO['대규모형'];

  if (
    fields.brandPreference === 'LX지인' ||
    fields.priority === '단열' ||
    fields.noiseSensitive === '예'
  ) return GROUP_INFO['프리미엄형'];

  if (fields.priority === '가격' || fields.brandPreference === '기타') return GROUP_INFO['가성비형'];

  if (fallbackCount >= 2 || fields.timing === '미정' || fields.timing === '6개월이후') return GROUP_INFO['정보수집형'];

  return GROUP_INFO['UNKNOWN'];
}

export function getGroupInfo(group: ConsumerGroup): ConsumerGroupInfo {
  return GROUP_INFO[group];
}
