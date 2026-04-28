import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { ConsultationSubmission, QuoteData } from '@/types/quote';
import type { ConsumerGroupInfo, ExtractedChatFields } from '@/types/chat';
import type { QuoteLevel } from '@/types/quote';

type SheetAppendInput = {
  customerName: string;
  phone: string;
  address?: string;
  preferredDate?: string;
  quoteData?: QuoteData;
  recommendedBrand?: string;
  consultationNeeded?: boolean;
  fallbackCount?: number;
  // 운영자용 추가 필드
  consumerGroup?: ConsumerGroupInfo;
  quoteLevel?: QuoteLevel;
  extractedFields?: Partial<ExtractedChatFields>;
};

// 소비자 그룹 + 견적 레벨 기반 추천 상담 전략 생성
function buildConsultationStrategy(
  group: ConsumerGroupInfo | undefined,
  quoteLevel: QuoteLevel | undefined,
  consultationNeeded: boolean,
): string {
  if (consultationNeeded) return '대화 난항 — 직접 전화 상담 즉시 필요';

  const g = group?.group ?? 'UNKNOWN';
  const lv = quoteLevel ?? 0;

  if (g === '긴급형') return '당일/익일 방문 상담 제안, 빠른 시공 일정 확인';
  if (g === '프리미엄형' && lv >= 2) return 'LX지인 프리미엄 라인 강조, 에너지 절감 효과 시연';
  if (g === '프리미엄형') return '추가 정보 수집 후 프리미엄 제안 — 방문 상담 유도';
  if (g === '가성비형') return 'KCC/기타 비교표 제시, 장기 A/S 조건 강조';
  if (g === '대규모형') return '현장 방문 견적 필수, 전체 패키지 할인 제안';
  if (g === '정보수집형') return '카탈로그/유튜브 자료 발송 후 1주 내 후속 연락';
  if (lv >= 2) return '견적 완성도 높음 — 방문 상담 전환 시도';
  return '표준 상담 프로세스 진행';
}

// 우선순위 결정 (상/중/하)
function buildPriority(
  group: ConsumerGroupInfo | undefined,
  quoteLevel: QuoteLevel | undefined,
  consultationNeeded: boolean,
): string {
  if (consultationNeeded) return '상';

  const g = group?.group ?? 'UNKNOWN';
  const lv = quoteLevel ?? 0;

  if (g === '긴급형' || g === '대규모형') return '상';
  if (g === '프리미엄형' && lv >= 2) return '상';
  if (g === '프리미엄형' || (g === '가성비형' && lv >= 1) || lv >= 2) return '중';
  return '하';
}

// 견적 데이터를 시트에서 바로 읽을 수 있는 한 줄 요약으로 변환
function formatQuoteSummary(quoteData?: QuoteData) {
  if (!quoteData || typeof quoteData !== 'object') return '견적 정보 없음';

  if (quoteData.type === 'chat') {
    return ['대화형', `공간: ${quoteData.data?.space || '-'}`, `창 개수: ${quoteData.data?.count || '-'}`].join(' | ');
  }

  if (quoteData.type === 'ai') {
    return [
      'AI상담',
      `주거: ${quoteData.data?.housingType || '-'}`,
      `평형: ${quoteData.data?.pyeong || '-'}`,
      `공간: ${quoteData.data?.space || '-'}`,
      `노후: ${quoteData.data?.age || '-'}`,
      `고민: ${quoteData.data?.problem || '-'}`,
      `시기: ${quoteData.data?.timing || '-'}`,
    ].join(' | ');
  }

  if (quoteData.type === 'smart-lego' || quoteData.type === 'lego') {
    return [
      '레고식',
      `주거: ${quoteData.data?.housingType || '-'}`,
      `평형: ${quoteData.data?.pyeong ? `${quoteData.data.pyeong}평` : '-'}`,
      `확장: ${quoteData.data?.expansion || '-'}`,
    ].join(' | ');
  }

  return '알 수 없는 견적 형식';
}

function buildSheetValues(input: SheetAppendInput) {
  const strategy = buildConsultationStrategy(
    input.consumerGroup,
    input.quoteLevel,
    input.consultationNeeded ?? false,
  );
  const priority = buildPriority(
    input.consumerGroup,
    input.quoteLevel,
    input.consultationNeeded ?? false,
  );
  const groupLabel = input.consumerGroup
    ? `${input.consumerGroup.emoji} ${input.consumerGroup.label}`
    : '-';
  const f = input.extractedFields ?? {};

  return [[
    new Date().toLocaleString('ko-KR'),   // A: 접수일시
    input.customerName || '미입력',         // B: 이름
    input.phone || '',                      // C: 연락처
    input.address || '',                    // D: 주소
    input.preferredDate || '',              // E: 상담희망일
    formatQuoteSummary(input.quoteData),    // F: 견적요약
    input.recommendedBrand || 'LX지인',     // G: 추천브랜드
    input.consultationNeeded ? '⚠️ 필요' : '일반',  // H: 상담필요여부
    input.fallbackCount ?? 0,              // I: fallback횟수
    // 운영자 추가 컬럼
    groupLabel,                            // J: 소비자그룹
    input.quoteLevel ? `레벨 ${input.quoteLevel}` : '-',  // K: 견적레벨
    f.housingType || '-',                  // L: 주거형태
    f.pyeong || '-',                       // M: 평형
    f.expansion || '-',                    // N: 확장여부
    f.space || '-',                        // O: 교체공간
    f.age || '-',                          // P: 창호연식
    f.problem || '-',                      // Q: 불편사항
    f.timing || '-',                       // R: 시공시기
    strategy,                              // S: 추천상담전략
    priority,                              // T: 우선순위
  ]];
}

function getGoogleAuth() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Missing Google Sheets API credentials in .env.local');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return { spreadsheetId, auth };
}

export async function appendConsultationSheetRow(input: SheetAppendInput) {
  const { spreadsheetId, auth } = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: '상담신청!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: buildSheetValues(input) },
  });
}

// Google Sheets API를 통한 데이터 전송 라우트
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConsultationSubmission;
    const { customer, quoteData, finalConsulting, consultationNeeded, fallbackCount } = body;

    const response = await appendConsultationSheetRow({
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      preferredDate: customer.preferredDate,
      quoteData,
      recommendedBrand: finalConsulting?.recommendedBrand || 'LX지인',
      consultationNeeded,
      fallbackCount,
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    console.error('Google Sheets API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
