import { ExtractedChatFields } from '@/types/chat';

/**
 * 챗봇 대화 진행을 위한 필수 정보 인터페이스 (v2.0 고도화)
 * 3단계로 구성됨
 */
export interface RequiredInfo extends Omit<ExtractedChatFields, 'count'> {}

export type StepStage = 'BASIC' | 'DEEP' | 'DEEPER';

export interface QuestionStep {
  key: keyof ExtractedChatFields;
  label: string;
  question: string;
  stage: StepStage;
}

/**
 * 질문 단계 정의 (v2.0 3단계 통합)
 */
export const QUESTION_STEPS: QuestionStep[] = [
  // 1단계 (BASIC - 견적 기초)
  { key: 'housingType', label: '주거형태', stage: 'BASIC', question: '어떤 형태의 집인가요? (아파트, 빌라, 단독주택 등)' },
  { key: 'pyeong', label: '평형', stage: 'BASIC', question: '몇 평형인지 알려주실 수 있나요?' },
  { key: 'expansion', label: '확장여부', stage: 'BASIC', question: '확장형인가요, 아니면 비확장형인가요?' },
  { key: 'spaces', label: '공간', stage: 'BASIC', question: '교체를 원하시는 공간을 모두 선택해 주세요.' },
  { key: 'problem', label: '불편사항', stage: 'BASIC', question: '기존 창호를 쓰시면서 가장 불편한 점은 무엇인가요? (단열, 소음 등)' },
  { key: 'age', label: '노후도', stage: 'BASIC', question: '현재 창호가 설치된 지 얼마나 되었나요? (예: 15년 정도)' },
  { key: 'timing', label: '시공시기', stage: 'BASIC', question: '언제쯤 시공을 계획하고 계신가요?' },

  // 2단계 (DEEP - 정밀 견적)
  { key: 'floor', label: '층수', stage: 'DEEP', question: '거주하시는 곳이 몇 층인가요? (층수에 따라 장비비가 달라져요)' },
  { key: 'corner', label: '특이구조', stage: 'DEEP', question: '혹시 코너 창이나 특이한 구조의 창이 있나요?' },
  { key: 'brandPreference', label: '선호브랜드', stage: 'DEEP', question: '특별히 선호하시는 창호 브랜드가 있으신가요?' },

  // 3단계 (DEEPER - 맞춤 컨설팅)
  { key: 'lifestyle', label: '생활패턴', stage: 'DEEPER', question: '환기를 자주 시키시나요? 아니면 단열을 더 중시하시나요?' },
  { key: 'noiseSensitive', label: '소음민감도', stage: 'DEEPER', question: '평소 외부 소음에 민감하신 편인가요?' },
  { key: 'priority', label: '우선순위', stage: 'DEEPER', question: '가격, 디자인, 에너지절감 중 무엇이 가장 중요하세요?' }
];

/**
 * 현재 누락된 정보 중 가장 우선순위가 높은 다음 질문 추출
 * 이미 답변된 질문은 무조건 건너뜀
 */
export function getNextQuestion(fields: ExtractedChatFields): QuestionStep | null {
  for (const step of QUESTION_STEPS) {
    const value = fields[step.key];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value || value === 'null' || value === '';
    if (isEmpty) {
      return step;
    }
  }
  return null;
}

/**
 * 특정 스테이지의 모든 정보가 수집되었는지 확인
 */
export function isStageCollected(fields: ExtractedChatFields, stage: StepStage): boolean {
  return QUESTION_STEPS
    .filter(step => step.stage === stage)
    .every(step => {
      const value = fields[step.key];
      return Array.isArray(value) ? value.length > 0 : !!value && value !== 'null' && value !== '';
    });
}

/**
 * 모든 필수 정보가 수집되었는지 확인
 */
export function isAllInfoCollected(fields: ExtractedChatFields): boolean {
  return QUESTION_STEPS.every(step => {
    const value = fields[step.key];
    return Array.isArray(value) ? value.length > 0 : !!value && value !== 'null' && value !== '';
  });
}
