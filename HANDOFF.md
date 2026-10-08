# 창호 견적 사이트 인계

최근 갱신: 2026-10-08

## 웹 배포 방안 검토 (2026-10-08)

### 후속 실행

- 사용자가 진행을 승인했다. Cloud Run 오류 로그에서 `The request failed because billing is disabled for this project.`를 확인했다. 프로젝트 `billingEnabled: false`, 연결된 기존 결제 계정 `open: false`가 직접 원인이다. 사용자에게 결제 재개 또는 유효한 계정 연결을 요청했다.
- 기존 Cloud Build 트리거 `window-estimate-main`은 GitHub `kangHo-Jun/Window`의 `^main$`과 `window-estimate-system/cloudbuild.yaml`에 연결되어 있다. 현재 개발 브랜치는 자동 배포 대상이 아니다. 트리거와 main은 변경하지 않았다.
- Cloud Build 작업 디렉터리를 앱 폴더로 수정하고, `npm ci`에 필요한 package-lock.json을 추적 대상에 포함했다. Docker 전송에서 모든 `.env*`, Git 메타데이터 및 로그를 제외했다.
- `npm run build` 통과. CSV 동적 경로에 대한 Turbopack 파일 추적 경고가 남아 있으며 오류는 아니다. `git diff --check` 통과.
- gcloud는 `CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11`로 실행해야 현재 로컬 Python 호환성 오류를 피한다. GitHub 인증은 샌드박스 밖에서 정상이다.
- 다음 작업: 결제 활성화 확인 → 별도 테스트 서비스 배포 및 전체 동작 검증 → 배포 브랜치 확정 및 운영 반영. 결제 문제로 실제 새 버전 배포 및 웹 검증은 아직 수행하지 못했다.

- 사용자 요청에 따라 방안만 검토했다. 코드 변경, 푸시, 배포는 실행하지 않았다.
- 운영 URL을 다시 조회해 HTTP 500을 확인했다. 원인은 서버 로그 확인이 필요하다.
- 현재 Next.js 서버 API, Firestore, Gemini, Sheets 및 서버 CSV 읽기 구조를 고려해 기존 Cloud Run 복구와 GitHub → Cloud Build 자동 배포 연결을 우선 제안한다. Vercel은 대안이며 GitHub Pages만으로 현재 서버 기능을 실행할 수 없다.
- 다음 실행 시 배포 루트 `window-estimate-system/`, CSV 포함 여부, 환경변수·서비스 계정 권한, Cloud Build 트리거의 연결·대상 브랜치를 확인한다. 기존 `cloudbuild.yaml`은 `--source .`를 사용하므로 실제 작업 디렉터리를 점검해야 한다.
- 먼저 별도 테스트 서비스에서 견적·챗봇·PDF·시트 저장을 검증하고 운영 반영한다. 기존 main 보존 원칙을 지키며 자동 배포 브랜치는 실행 단계에서 확정한다.

## 최근 진행

- iCloud `프로젝트/창호`의 작업본을 로컬 `Projects/창호/창호-견적-사이트`로 복사했다. iCloud 원본은 유지했다.
- GitHub `kangHo-Jun/Window`에서 Git 이력을 가져와 원본과 동일한 `feature/pdf-knowledge-rag` HEAD(`a880a8a`)로 연결했다. 원본 작업본에 있던 추적 파일 수정과 새 파일도 로컬 복사본에 보존했다.
- 현재 Next.js 사이트, 창호 지식, 견적 CSV, 기획, 운영 자료, 이전 정적 페이지를 용도별로 분류했다. CSV 6개와 진단 지식DB의 동일한 `public/` 사본은 제거하고 서버가 앱 내부 `data/source/`의 단일 원본을 읽도록 경로를 바꿨다.
- 서비스 계정 JSON은 Git에서 제외되는 `private/credentials/`로 옮겼다. `.env.local`의 값은 수정하지 않았다.
- 재생성 가능한 iCloud의 `.next/`, `node_modules/`, macOS 시스템 파일, 창호 프로젝트와 무관한 `Codex.dmg`는 새 작업본에 복사하지 않았다.
- 별도 내장 Git 저장소인 `.agent/skills`는 사이트 실행과 무관한 외부 스킬 묶음이므로 새 작업본에서 제외했다.
- 로컬에서 `npm ci --offline --ignore-scripts` 후 `npm run build`가 통과했다. 개발 서버 `http://127.0.0.1:3002`에서 홈 화면은 HTTP 200, 이전 공개 CSV 경로는 HTTP 404를 확인했다.
- `git diff --check`에서 공백 오류가 없음을 확인했다.
- 2026-10-07 재검증: `npm run build` 통과. 프로덕션 서버의 `/api/chat`에 `아파트`를 보내 HTTP 200과 다음 질문·선택지를 확인했다. 이 기본 대화에서는 CSV를 읽었으며, 응답의 `아파트님` 호칭은 개선이 필요하다.
- `npm run lint`는 오류 3건(`verify_loading_quote.spec.js`의 `require`, `dynamicQuestion.ts`의 빈 인터페이스, `ragEngine.ts`의 `any`)과 경고 5건으로 실패했다.
- GitHub 저장소가 공개 상태임을 확인하고 `knowledge/sources/`, `knowledge/generated/`, `private/`을 업로드 대상에서 제외했다.
- `feature/pdf-knowledge-rag` 브랜치에 로컬 이전·폴더 정리·기존 미커밋 RAG 작업을 커밋하고 GitHub에 푸시했다. 기본 `main` 브랜치는 변경하지 않았다.
- Codex 사이드바에 `창호 웹사이트·챗봇`, `창호팀 관리·보고서`, `창호 홍보영상` 섹션을 만들고 관련 과거 대화를 업무별로 분류했다. 이 프로젝트의 사이트 개발 대화와 이전 실행 설정 대화는 웹사이트 섹션에 둔다.
- 전역 `PROJECTS.md`의 창호 견적 사이트 기본 경로를 새 로컬 작업본으로 갱신했다. 창호팀 관리와 영상 자료의 별도 경계는 유지했다.

## 미해결

- iCloud 원본은 과거 작업본으로 남아 있다. 앞으로 로컬 작업본을 기준으로 삼고 두 위치에서 동시에 편집하지 않는다.
- Cloud Run 운영 주소는 2026-10-07 확인 시 500 오류였다. 운영 복구는 이번 폴더 정리 범위에 포함되지 않았다.
- GitHub 브랜치에 코드를 올려도 서버가 자동으로 배포되지는 않는다. GitHub에서 확인 가능한 것은 코드와 문서이며, 실제 공개 사이트는 별도 배포가 필요하다.
- 현재 브랜치의 기존 미커밋 변경은 보존했으며, 이번 정리 변경과 함께 검토해야 한다.
- 외부 스킬 묶음 `.agent/skills`는 새 작업본에 포함하지 않았으며 Git 상태에서 삭제로 나타난다. 원본은 iCloud에 보존돼 있다.

## 다음 작업

- 챗봇의 지식 검색과 견적 완료까지의 전체 대화, PDF 다운로드, 시트 저장을 실제로 검증한다.
- 린트 오류 3건과 부자연스러운 호칭을 수정한다.
- 운영 배포 복구 여부와 이전 iCloud 작업본의 보관 방식을 결정한다.
