import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { ConsultationSubmission, QuoteData } from '@/types/quote';

/**
 * 견적 데이터를 시트에서 바로 읽을 수 있는 한 줄 요약으로 변환
 */
function formatQuoteSummary(quoteData?: QuoteData) {
  if (!quoteData || typeof quoteData !== 'object') {
    return '견적 정보 없음';
  }

  if (quoteData.type === 'chat') {
    return [
      '대화형',
      `공간: ${quoteData.data?.space || '-'}`,
      `창 개수: ${quoteData.data?.count || '-'}`,
      `예산: ${quoteData.data?.budget || '-'}`,
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

/**
 * Google Sheets API를 통한 데이터 전송 라우트
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConsultationSubmission;
    const { customer, quoteData, finalConsulting } = body;

    // 환경변수 확인
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
       console.error("Missing Google Sheets API credentials in .env.local");
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // Auth 인증
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 시트에 추가할 행 데이터 구성
    const values = [
      [
        new Date().toLocaleString('ko-KR'), // 신청 시각
        customer.name,                      // 이름
        customer.phone,                     // 연락처
        customer.address,                   // 주소
        customer.preferredDate,             // 상담 희망일
        formatQuoteSummary(quoteData),      // 사람이 읽기 쉬운 견적 요약
        finalConsulting?.recommendedBrand || 'LX지인' // 추천 브랜드
      ]
    ];

    // 데이터 추가 (Append)
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '상담신청!A2', // 사용자의 요청에 따라 '상담신청' 시트 지정
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    console.error("Google Sheets API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
