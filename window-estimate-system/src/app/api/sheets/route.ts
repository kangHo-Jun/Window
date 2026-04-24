import { google } from 'googleapis';
import { NextResponse } from 'next/server';

/**
 * Google Sheets API를 통한 데이터 전송 라우트
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
        JSON.stringify(quoteData),          // 견적 원본 데이터 (JSON)
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
  } catch (error: any) {
    console.error("Google Sheets API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit" }, { status: 500 });
  }
}
