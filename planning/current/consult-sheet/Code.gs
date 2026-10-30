/**
 * 대산 홈페이지 상담 신청 → 구글 시트 접수
 *
 * 설치: 시트 '대산 상담 신청 접수' > 확장 프로그램 > Apps Script 에 이 파일 내용을 붙여넣고
 *       배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자). 자세한 순서는 README.md.
 *
 * 홈페이지는 JSON 글을 text/plain 으로 보낸다(브라우저 사전 확인 요청을 피하려고).
 * 보내는 항목: phone, name, area, topic, message, agree, page, website(스팸 방지 숨김칸)
 */

// 새 신청이 오면 알림 메일을 받을 주소. 비워 두면 메일을 보내지 않는다.
// 여러 명이면 쉼표로 잇는다. 예: 'sales@example.com,boss@example.com'
const NOTIFY_EMAIL = 'idnnatee@naver.com';

const TIMEZONE = 'Asia/Seoul';
const HEADERS = ['접수 시각', '연락처', '이름·업체명', '현장 지역', '관심 내용', '문의 내용',
                 '개인정보 동의', '접수 화면', '처리 상태', '담당자', '메모'];
const MAX_LEN = { phone: 30, name: 60, area: 60, topic: 30, message: 2000, page: 200 };

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return reply_({ ok: false, error: 'bad_request' });
  }

  // 사람에게는 보이지 않는 칸. 채워져 있으면 자동 입력 프로그램이므로 접수한 척만 한다.
  if (clean_(data.website, 100)) return reply_({ ok: true });

  const phone = clean_(data.phone, MAX_LEN.phone);
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 12) return reply_({ ok: false, error: 'phone' });
  if (data.agree !== true) return reply_({ ok: false, error: 'agree' });

  const row = [
    Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm'),
    "'" + phone,                       // 앞자리 0이 숫자로 바뀌어 사라지지 않게 글자로 저장
    clean_(data.name, MAX_LEN.name),
    clean_(data.area, MAX_LEN.area),
    clean_(data.topic, MAX_LEN.topic),
    clean_(data.message, MAX_LEN.message),
    '동의',
    clean_(data.page, MAX_LEN.page),
    '신규',                            // 처리 상태: 직원이 '연락함' '완료' 등으로 바꿔 쓴다
    '',
    ''
  ];

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);              // 동시에 들어온 신청이 같은 줄에 겹쳐 쓰이지 않게
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);   // 빈 시트면 제목 줄부터
    sheet.appendRow(row);
  } catch (err) {
    return reply_({ ok: false, error: 'save' });
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, '[대산] 새 상담 신청 ' + phone,
        ['접수 시각: ' + row[0], '연락처: ' + phone, '이름·업체명: ' + row[2], '현장 지역: ' + row[3],
         '관심 내용: ' + row[4], '문의 내용:', row[5], '', '시트: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()].join('\n'));
    } catch (err) {
      // 메일이 실패해도 접수는 이미 시트에 저장됐으므로 성공으로 답한다
    }
  }
  return reply_({ ok: true });
}

// 배포 주소를 브라우저로 열었을 때 연결 확인용
function doGet() {
  return reply_({ ok: true, service: 'daesan-consult' });
}

// 글자만 남기고 길이를 자른다. =, +, -, @ 로 시작하면 시트가 수식으로 읽지 않게 앞에 ' 를 붙인다
function clean_(value, max) {
  let s = String(value == null ? '' : value).replace(/[\u0000-\u0009\u000B-\u001F]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
