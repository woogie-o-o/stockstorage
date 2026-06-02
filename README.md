# 우기의 주식

`stockstorage`의 핵심 데이터 흐름을 웹 브라우저용 SPA로 재구성한 반응형 주식 웹앱입니다.

## 로컬 실행

```bash
python3 server.py
```

브라우저에서 `http://127.0.0.1:8019`를 엽니다.

다른 포트를 쓰려면 다음처럼 실행합니다.

```bash
WOOGI_PORT=8020 python3 server.py
```

컨테이너/Cloud Run 환경에서는 `PORT`와 `WOOGI_HOST=0.0.0.0`을 사용합니다. 저장소의 `Dockerfile`은 비권한 `appuser`로 기본 `PORT=8080`의 `server.py`를 실행하며 `/healthz`로 상태 확인을 제공합니다. 서버 응답에는 CSP, MIME 스니핑 방지, iframe 삽입 방지, 과도한 referrer 전달 제한, 카메라·마이크·위치 권한 제한 헤더가 포함됩니다.

```bash
docker build -t woogi-stock .
docker run --rm -p 8080:8080 woogi-stock
```

Cloud Run에서는 제외된 `config.local.js` 대신 환경 변수로 Firebase Web App 설정을 주입할 수 있습니다. `server.py`가 `/config.local.js` 요청에 브라우저용 설정 스크립트를 동적으로 반환합니다. 이 경로는 Firebase 웹 설정, API base URL, 선택적 관리자 UID만 노출하며 Functions 시크릿은 포함하지 않습니다.

```bash
WOOGI_FIREBASE_API_KEY=... \
WOOGI_FIREBASE_AUTH_DOMAIN=... \
WOOGI_FIREBASE_PROJECT_ID=... \
WOOGI_FIREBASE_STORAGE_BUCKET=... \
WOOGI_FIREBASE_MESSAGING_SENDER_ID=... \
WOOGI_FIREBASE_APP_ID=... \
WOOGI_ADMIN_UIDS=uid-a,uid-b \
docker run --rm -p 8080:8080 woogi-stock
```

프런트와 API 프록시가 다른 origin에 배포되면 로컬 `config.local.js` 또는 Cloud Run의 `WOOGI_API_BASE_URL` 환경 변수에서 API 프록시 주소를 지정합니다.

```js
window.WOOGI_API_BASE_URL = "https://your-cloud-run-url";
```

## 검증

CDP를 제외한 로컬 회귀 검사는 다음 한 줄로 먼저 확인할 수 있습니다.

```bash
node tests/local-regression-check.mjs
```

실행 중인 앱 서버와 CDP Chrome까지 준비된 최종 점검은 다음 한 줄로 실행합니다.

```bash
node tests/final-regression-check.mjs
```

최종 점검은 시작 전에 `server.py`의 `/healthz`와 CDP Chrome 포트를 먼저 확인합니다.

실행 중인 `server.py`까지 확인하려면 live smoke를 추가합니다.

```bash
node tests/local-regression-check.mjs --live
```

CDP Chrome이 없는 환경에서는 최종 점검에서 브라우저 회귀만 건너뛸 수 있습니다.

```bash
node tests/final-regression-check.mjs --skip-cdp
```

운영 배포 직전에는 같은 최종 점검 명령에 strict 모드를 추가합니다. 내부 readiness 경고 중 운영 필수 항목이 실패로 승격됩니다.

```bash
node tests/final-regression-check.mjs --strict
```

macOS에서 CDP Chrome을 직접 띄울 때는 다음처럼 실행할 수 있습니다.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9223 --disable-gpu --disable-background-networking --disable-sync --no-first-run --no-default-browser-check --user-data-dir=/private/tmp/woogi-cdp about:blank
```

개별 검증 명령은 다음과 같습니다.

```bash
node --check src/app.js
node --check functions/index.js
node --check functions/analysis.js
node --check functions/nightFutures.js
PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile server.py
node tests/static-check.mjs
node tests/firestore-like-integrity-check.mjs
node tests/firestore-write-schema-check.mjs
node tests/firestore-user-schema-check.mjs
PYTHONPYCACHEPREFIX=/tmp python3 tests/fmkorea-parser-check.py
node tests/functions-provider-config-check.mjs
node tests/functions-night-futures-check.mjs
PYTHONPYCACHEPREFIX=/tmp python3 tests/server-log-message-check.py
PYTHONPYCACHEPREFIX=/tmp python3 tests/server-browser-config-check.py
PYTHONPYCACHEPREFIX=/tmp python3 tests/server-security-headers-check.py
node tests/server-http-contract-check.mjs
node tests/night-futures-normalize-check.mjs
node tests/api-smoke-check.mjs
node tests/cdp-run-all.mjs
node tests/production-readiness-env-check.mjs
node tests/production-readiness-check.mjs
```

상세 구현/검증 결과는 `IMPLEMENTATION_REPORT.md`에 정리했습니다.

readiness만 따로 확인할 때는 실행 중인 앱 URL을 넣고 strict 모드로 외부 설정 누락을 확인합니다. 이 검사는 로컬 `config.local.js` 또는 Cloud Run `WOOGI_FIREBASE_*` 환경 변수, Firebase CLI, Firebase 설정값, Functions 설정, `/healthz`를 점검하며 실제 프로젝트 값이 없으면 실패합니다.
경고나 실패가 있으면 마지막에 남은 `next actions`도 함께 출력합니다.

```bash
WOOGI_APP_URL=http://127.0.0.1:8019 node tests/production-readiness-check.mjs --strict
```

헤드리스 Chrome을 CDP 포트로 띄운 상태라면 로컬 AI 분석이 실제 재무·뉴스 근거를 쓰는지도 확인할 수 있습니다.

CDP 검증은 같은 origin의 `localStorage`를 사용하므로 한 번에 하나씩 실행하거나, 아래 순차 러너를 사용합니다. 순차 러너는 각 테스트 전후 앱 테스트 탭을 정리하고 headless Chrome 유지를 위한 `about:blank` 탭을 남깁니다.

```bash
node tests/cdp-run-all.mjs
```

```bash
node tests/cdp-ai-check.mjs
```

시장/종목 상세의 실시간 출처 표시, 마감 수급 상세, 펨코지수/HOT 상세, 시장 심리 상세 지표, 데스크톱·태블릿·모바일 가로 오버플로는 다음 검증으로 확인합니다.

```bash
node tests/cdp-market-source-check.mjs
```

직접 URL과 원본 딥링크 alias(`/stock/...`, `/pick/...`, `/analysis/...`, `/post/...`, `/journal-share/...`, `/index/...`)는 다음 검증으로 확인합니다.

```bash
node tests/cdp-deep-link-check.mjs
```

이메일 회원가입, 관심종목, 메모, 댓글, 매매일지 작성/수정/삭제, 커뮤니티 글/댓글/좋아요/신고 로컬 쓰기 흐름은 다음 검증으로 확인합니다.

```bash
node tests/cdp-local-flows-check.mjs
```

커뮤니티 게시글 상세, 이미지 첨부, 글 수정/삭제, 댓글 삭제, 내 글/내 댓글 전용 화면, 작성자 팔로우와 차단 흐름은 다음 검증으로 확인합니다.

```bash
node tests/cdp-community-detail-check.mjs
```

공개 매매일지 상세, 좋아요, 댓글 작성/삭제, 내 댓글 연동, 작성자 차단 흐름은 다음 검증으로 확인합니다.

```bash
node tests/cdp-journal-share-check.mjs
```

매매일지 종목별 실제 일봉, 매수/매도 마커, 거래 이벤트, 모바일 오버플로는 다음 검증으로 확인합니다.

```bash
node tests/cdp-journal-chart-check.mjs
```

관리자 추천주/공지/신고함/회원 관리, 로그아웃 후 재로그인, 글로벌 검색, 종목 검색, 관심 해제 흐름은 다음 검증으로 확인합니다.

```bash
node tests/cdp-admin-auth-search-check.mjs
```

seed에 없는 미국 티커도 검색 결과를 상세 데이터 풀에 등록하고, 현재가와 일봉 차트를 갱신하는지 다음 검증으로 확인합니다.

```bash
node tests/cdp-discovered-search-check.mjs
```

시황 분석 상세, 이미지 첨부, 댓글, 관리자 작성/수정/삭제 흐름은 다음 검증으로 확인합니다.

```bash
node tests/cdp-market-analysis-check.mjs
```

원본 부가 화면에서 가져온 특징주 상세, 보유 현황, 종목 비교, 종료 추천주 실적은 다음 검증으로 확인합니다.

```bash
node tests/cdp-secondary-features-check.mjs
```

## Firebase 연결

실제 Firebase Auth/Firestore/Functions를 붙이려면 로컬에서는 `config.example.js`를 `config.local.js`로 복사한 뒤 값을 채웁니다. Cloud Run에서는 같은 Firebase Web App 값을 `WOOGI_FIREBASE_API_KEY`, `WOOGI_FIREBASE_AUTH_DOMAIN`, `WOOGI_FIREBASE_PROJECT_ID`, `WOOGI_FIREBASE_STORAGE_BUCKET`, `WOOGI_FIREBASE_MESSAGING_SENDER_ID`, `WOOGI_FIREBASE_APP_ID` 환경 변수로 주입할 수 있습니다. `config.local.js`는 `.gitignore`에 포함되어야 하며, OpenAI/DART/KIS 시크릿은 코드에 하드코딩하지 않습니다. `WOOGI_ADMIN_UIDS`는 관리자 화면 표시용 UI 힌트입니다. 실제 Firestore·Storage 권한은 rules의 관리자 UID 목록 또는 Firebase Auth custom claim `{ admin: true }`로 부여합니다.

Firestore/Storage 권한과 공개 매매일지 인덱스는 `firebase.json`, `firebase/firestore.rules`, `firebase/storage.rules`, `firebase/firestore.indexes.json`에 정리되어 있습니다. 실제 프로젝트 ID를 선택한 뒤 Firebase CLI에서 다음처럼 배포할 수 있습니다.

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

AI 분석 callable은 `functions/`에 `generateStockAiAnalysis`로 준비되어 있습니다. KOSPI200 야간선물은 `recordNightFuturesPrice` 스케줄러가 KIS WebSocket 체결가를 `night_futures_prices`에 쌓고, `getKospiNightFutures`/`getKisNightFuturesConfig` callable이 최신 상태와 히스토리를 반환합니다. `getMarketProviderConfig` callable은 OpenAI, DART, KIS secret 설정 여부만 반환해 운영 연결 상태를 노출값 없이 확인합니다. OpenAI/DART/KIS 키는 Functions secret으로만 설정합니다.

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set DART_API_KEY
firebase functions:secrets:set KIS_APP_KEY
firebase functions:secrets:set KIS_APP_SECRET
firebase deploy --only functions:generateStockAiAnalysis,functions:recordNightFuturesPrice,functions:getKospiNightFutures,functions:getKisNightFuturesConfig,functions:getMarketProviderConfig
```

앱은 Firebase 설정이 없을 때도 로컬 저장소 기반으로 로그인, 관심종목, 매매일지, AI 분석 캐시, 글/댓글 흐름을 검증할 수 있습니다. Firebase 설정이 있으면 원본과 같은 컬렉션 이름(`stock_picks`, `market_feature_stocks`, `night_futures_prices`, `trading_journal`, `trading_journal/{id}/comments`, `trading_journal/{id}/likes`, `posts`, `posts/{id}/comments`, `announcements`, `users/{uid}/stock_ai_analyses`, `users/{uid}/blockedUsers`, `users/{uid}/post_author_follows`, `user_public/{uid}`)으로 읽기/쓰기를 시도합니다. 공개 게시글, 공개 매매일지, 댓글, 신고 쓰기는 Firestore rules에서 허용 필드와 타입을 제한하고, 공개 매매일지 댓글과 좋아요는 일지 공개 상태를 함께 확인합니다. 공개 레벨 요약 `user_public/{uid}`와 사용자 하위 컬렉션의 메모, 댓글 인덱스, 차단, 작성자 팔로우, AI 분석 캐시도 앱이 쓰는 payload 형태로 제한합니다. 로그인/회원가입 시 KST 기준 일일 출석을 한 번 기록해 `attendanceCount`, `lastAttendanceDate`, 레벨을 갱신하고, 공개 레벨 요약은 `user_public/{uid}`에 동기화합니다. `storageBucket`이 있으면 게시글과 시황 분석 첨부 이미지는 Firebase Storage에 올린 뒤 다운로드 URL을 저장하고, 로컬 검증 환경에서는 작은 이미지 data URL을 저장합니다.

시세/검색/차트/시장심리/마감 수급/업종·시장 폭/KOSPI200 야간선물/시장 브리프/펨코 지수/종목 재무/뉴스/공시/종목토론방은 브라우저 CORS를 피하기 위해 `server.py`가 `/api/quote`, `/api/search`, `/api/history`, `/api/sentiment`, `/api/investor-flow`, `/api/market-sectors`, `/api/night-futures`, `/api/market-brief`, `/api/fmkorea`, `/api/fundamentals`, `/api/news`, `/api/disclosures`, `/api/discussions`를 제공합니다. 기본값은 같은 origin의 `/api/*`이고, `WOOGI_API_BASE_URL`이 있으면 해당 API 프록시 origin을 사용합니다. 특징주 상세는 포착 사유, 거래대금, 거래량 배수, 포착 점수, 실제 일봉 차트, 종목토론방과 종목 상세/AI 분석 연결을 제공합니다. 마감 수급 상세는 KOSPI/KOSDAQ 외국인·기관 순매수 TOP5를 분리해 보여주고 공유 문구 복사와 종목 상세 진입을 제공합니다. 펨코지수 상세는 공개 주식 게시판 글 수 추이와 HOT 종목 요약을 차트로 보여주고, 펨코 HOT 상세는 언급량/게시글 수 기준 종목 목록과 공유 문구 복사, 종목 상세 진입을 제공합니다. 시장 심리 상세는 CNN Fear & Greed 점수에 더해 VIX, 미 10년/3개월 국채금리, 달러 인덱스, 구리, 금 시세를 같은 프록시 현재가로 갱신하고 장단기 금리차와 구리/금 비율을 표시합니다. 종목 상세는 실제 OHLC 일봉을 기본 캔들 차트로 표시하고 `MA5`, `MA20`, `MA60` 이동평균선과 라인 차트 전환을 제공합니다. 국내 종목과 KOSPI/KOSDAQ 지수 일봉은 Naver 차트 API를 우선 사용하고, 마감 수급 TOP5와 국내 종목 상세의 최신 공시·종목토론방 글은 Naver Finance 페이지를 서버에서 파싱합니다. 업종 등락은 Naver Finance 업종별 시세, 시장 폭은 Naver 모바일 시총 API 전체 종목을 사용해 ETF/ETN을 제외한 KOSPI·KOSDAQ 상승·하락·보합 종목 수를 계산합니다. KOSPI200 야간선물은 원본 KIS OpenAPI 단축코드 산정과 18:00~05:00 KST 세션 상태를 서버에서 제공하며, `KIS_APP_KEY`/`KIS_APP_SECRET` 없이도 화면은 연동 대기 상태를 안전하게 표시합니다. 운영 수집기가 만든 스냅샷은 `WOOGI_NIGHT_FUTURES_SNAPSHOT` 또는 `WOOGI_NIGHT_FUTURES_HISTORY_FILE`로 주입할 수 있습니다. Firebase `ai_briefs/latest`가 없을 때도 홈의 AI 브리프는 지수, CNN Fear & Greed, 마감 수급, 업종·시장 폭, Google News RSS 기반 서버 브리프로 자동 갱신됩니다. Firebase 펨코 집계 문서가 없을 때는 `/api/fmkorea`가 공개 주식 게시판의 최근 게시글 수와 대표 종목 별칭 언급을 집계해 펨코 지수와 HOT 종목을 갱신합니다. 공개 게시판이 반복 접근을 제한하면 마지막 정상 스냅샷 또는 기존 로컬/Firebase 데이터를 유지하고 화면에 연결 제한 상태를 표시합니다. 해외/보조 이력과 재무는 Yahoo Finance를 사용합니다. Yahoo가 요청 제한에 걸리는 해외 현재가는 Stooq CSV, 미국 주식 일봉은 Nasdaq historical API fallback을 사용합니다. Yahoo 검색이 제한되더라도 유효한 미국 티커는 Stooq 현재가 조회로 직접 확인해 검색 결과를 구성합니다. 국내 종목 재무는 Naver Finance, 뉴스는 Google News RSS를 경유합니다. 앱 진입 시 시세와 수급, 업종·시장 폭, KOSPI200 야간선물, 시장 브리프, 펨코 지수를 한 번 자동 갱신하고, 종목·지수 상세 진입 시 차트를 자동 갱신합니다.

보유 현황은 매매일지를 종목별로 집계해 남은 수량과 평가손익을 계산합니다. 매매일지 차트는 같은 프록시의 6개월 실제 OHLC 일봉을 사용하며 거래일과 가장 가까운 일봉에 매수/매도 마커를 표시합니다. 종목 비교는 같은 프록시의 최대 5년 일봉을 사용하며, `1M`, `3M`, `6M`, `1Y`, `3Y`, `5Y` 기간별로 최대 3개 종목의 시작점 대비 수익률을 한 차트에 겹쳐 표시합니다. 종료 추천주 실적은 `stock_picks`의 `completed` 상태와 fallback 완료 추천주를 기준으로 승률·평균수익률·순위를 보여줍니다. 시황 분석은 `market_analyses`와 `market_analyses/{id}/comments` 흐름으로 상세, 이미지 첨부, 댓글, 관리자 작성/수정/삭제를 제공합니다. 커뮤니티는 `posts`, `posts/{id}/comments`, `posts/{id}/likes`, `users/{uid}/myPostComments`, `users/{uid}/blockedUsers`, `users/{uid}/post_author_follows` 흐름으로 상세, 이미지 첨부, 수정/삭제, 댓글 삭제, 좋아요 토글, 팔로우, 차단을 제공합니다. 공개 매매일지는 `trading_journal`, `trading_journal/{id}/comments`, `trading_journal/{id}/likes`, `users/{uid}/myJournalComments` 흐름으로 상세, 댓글, 좋아요, 차단을 제공합니다. Firestore 연결 시 게시글과 공개 일지의 좋아요는 카운터 변경과 사용자별 like 문서 변경을 하나의 transaction으로 처리하며, rules도 최종 상태를 함께 검증합니다.
