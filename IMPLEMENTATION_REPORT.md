# 우기의 주식 구현 보고서

## 구현 상태

- `/Users/Jeongs/repo/new_canslim`에 반응형 웹 SPA를 구현했다.
- 원본 `stockstorage`의 Flutter/Firebase 데이터 흐름을 분석해 주요 컬렉션명과 Cloud Function 이름을 웹 서비스 계층에 반영했다.
- 로컬 실행은 `python3 server.py`로 가능하며 기본 포트는 `http://127.0.0.1:8019`다.
- `Dockerfile`과 `.dockerignore`를 추가해 `server.py` 프록시를 컨테이너/Cloud Run 환경에서 비권한 `appuser`, `PORT=8080`, `WOOGI_HOST=0.0.0.0`으로 실행할 수 있게 했다. 이미지에서 제외한 `config.local.js` 대신 `WOOGI_FIREBASE_*` 환경 변수로 브라우저용 Firebase Web App 설정을 동적으로 제공한다.
- `WOOGI_API_BASE_URL`을 지원해 프런트와 API 프록시가 다른 origin에 배포되어도 같은 API 호출 코드를 사용할 수 있게 했다.
- Firebase 설정이 없으면 로컬 저장소와 seed 데이터로 로그인, 관심종목, 매매일지, AI 분석, 커뮤니티 흐름을 검증한다.
- 로컬 `config.local.js` 또는 Cloud Run의 `WOOGI_FIREBASE_*` 환경 변수에 Firebase 설정을 넣으면 원본 흐름에 맞춰 Firestore/Auth/Functions/Storage 연결을 시도한다.
- `firebase.json`, `firebase/firestore.rules`, `firebase/storage.rules`, `firebase/firestore.indexes.json`에 운영 배포용 권한과 인덱스 초안을 포함했다.
- `functions/`에 `generateStockAiAnalysis` callable scaffold를 추가했다. OpenAI Responses API 호출은 Functions secret `OPENAI_API_KEY`가 있을 때만 실행하고, 실패하거나 secret이 없으면 deterministic 분석을 반환한다. `getMarketProviderConfig` callable은 OpenAI/DART/KIS secret 설정 여부만 반환해 운영 연결 상태를 노출값 없이 점검한다.
- `tests/production-readiness-check.mjs`를 추가해 운영 배포 전 로컬 `config.local.js` 또는 Cloud Run `WOOGI_FIREBASE_*` 환경 변수, Firebase/Functions/Docker 설정, CLI 가용성, `/healthz` 응답을 advisory/strict 모드로 점검할 수 있게 했다. 경고/실패 항목은 마지막에 `next actions`로 운영자가 해야 할 일을 요약한다.

## 보존/구현한 주요 화면

- 홈 대시보드: 시장 요약, 서버 fallback AI 시장 브리프, 추천주, 특징주, 관심종목, 공지, 커뮤니티 요약.
- AI포착/추천주: AI포착, 급등주, 거래대금, 거래량, 추천주, 종료 추천주, 탭/검색/시장 필터.
- 특징주 상세: 포착 사유, 실제 일봉 차트, 거래대금, 거래량 배수, 포착 점수, 종목토론방, 관심/종목 상세/AI 분석 연결.
- 종목 상세: 현재가, 실제 OHLC 캔들 차트, `MA5`·`MA20`·`MA60` 이동평균선, 라인 차트 전환, 실제 재무지표, 뉴스/공시/근거 패널, 네이버 종목토론방 최신 글, 댓글, 메모, 관심등록, AI 분석 진입.
- AI 분석 목록/결과: 생성, 캐시 조회, 재분석, 삭제, 점수, 리스크, 시나리오, 근거 자료 표시.
- 실시간 시장/지수: 국내외 지수, 환율, WTI, 시장 심리, 수급, Naver Finance 업종 등락과 ETF/ETN 제외 시장 폭, 공개 게시판 fallback 펨코 지수와 HOT 종목 요약.
- 마감 수급 상세: KOSPI/KOSDAQ 외국인·기관 순매수 TOP5, 공유 문구 복사, 수급 종목 상세 진입.
- 펨코지수/HOT 상세: 공개 주식 게시판 글 수 추이, HOT 종목 목록, 공유 문구 복사, HOT 종목 상세 진입.
- 시장 심리 상세: CNN Fear & Greed 점수, VIX, 미 10년/3개월 국채금리, 달러 인덱스, 구리, 금, 장단기 금리차와 구리/금 비율.
- 지수 상세: KOSPI/KOSDAQ 등 시장 카드 클릭, 현재값, 출처, 갱신 시각, 지수 차트 갱신.
- 시황 분석: `market_analyses` 목록, 상세, 이미지 URL/첨부 표시, 댓글, 관리자 작성/수정/삭제.
- 관심종목: 일반 관심종목과 관심 추천주 등록/해제/목록.
- 매매일지: 작성/수정/삭제, 날짜/종목 필터, 매수/매도 기록, 손익 요약, 종목별 6개월 실제 OHLC 캔들 차트와 매수/매도 마커.
- 공개 매매일지 공유: 커뮤니티 공개 일지 목록, 상세, 좋아요 토글, 댓글 작성/삭제, 내 댓글 연동, 작성자 차단.
- 직접 URL/딥링크: 해시 라우트뿐 아니라 `/stock/{key}`, `/post/{id}`, `/journal-share/{id}`, `/index/{ticker}`와 원본 alias `/pick/{pickId}`, `/analysis/{analysisId}` 진입을 지원.
- 보유 현황: 매매일지 기반 종목별 남은 수량, 평균단가, 평가금액, 평가손익.
- 종목 비교: 검색/시세/차트 프록시를 사용한 최대 3개 종목 현재가, 최대 5년 일봉, `1M`·`3M`·`6M`·`1Y`·`3Y`·`5Y` 통합 수익률 비교 차트.
- 종료 추천주 실적: 완료 추천주의 승률, 평균 수익률, 최고 수익, 순위.
- 사용자 레벨/출석: KST 기준 하루 1회 출석 카운트, 글/댓글 활동 XP, 공개 레벨 요약 `user_public/{uid}` 동기화.
- 기타: 커뮤니티 글 목록/상세, 이미지 첨부, 글 수정/삭제, 댓글 작성/삭제, 좋아요 토글, 신고, 작성자 팔로우/차단, 내 글/내 댓글 전용 화면, 공지사항, 프로필, 관리자 추천주/공지/신고/회원 관리 화면.

## 제거한 항목

- AdMob/전면/보상형/배너 광고 코드.
- 리워드 광고 XP와 광고 기반 AI 분석 게이트.
- ATT 권한 요청.
- FCM 푸시, 로컬 알림, 알림 설정, 알림 내역.
- Google, Apple, Kakao 간편 로그인과 SDK 초기화.
- 주문, 계좌 연동, 매매 실행 UI.

## 실제 데이터 연결 방식

- Firestore 읽기 대상: `stock_picks`, `stock_picks/{id}/comments`, `market_feature_stocks`, `announcements`, `posts`, `posts/{id}/comments`, `trading_journal`, `trading_journal/{id}/comments`, `market_analyses`, `market_analyses/{id}/comments`, `market_investor_flow`, `fmkorea_stock_mentions_realtime/today`, `fmkorea_index`, `night_futures_prices`, `ai_briefs/latest`, `reports`, `users`, `user_public`, `users/{uid}/stock_ai_analyses`, `users/{uid}/memos`, `users/{uid}/blockedUsers`, `users/{uid}/post_author_follows`.
- Firestore 쓰기 대상: `users/{uid}`, `user_public/{uid}`, `users/{uid}/favoriteStocks`, `users/{uid}/memos`, `users/{uid}/blockedUsers/{targetUid}`, `users/{uid}/post_author_follows/{targetUid}`, `users/{uid}/myPostComments/{id}`, `users/{uid}/myJournalComments/{id}`, `trading_journal/{id}`, `trading_journal/{id}/likes/{uid}`, `trading_journal/{id}/comments/{id}`, `posts/{id}`, `posts/{id}/likes/{uid}`, `posts/{id}/comments/{id}`, `market_analyses/{id}`, `market_analyses/{id}/comments/{id}`, `reports/{id}`, `announcements/{id}`, `stock_picks/{id}`.
- AI 분석 함수: `generateStockAiAnalysis` callable. 함수는 브라우저가 보낸 종목, 현재가, 재무, 캔들, 뉴스 입력으로 클라이언트가 기대하는 분석 스키마를 반환하며, OpenAI Responses API 호출 실패 시에도 fallback 스키마를 반환한다.
- KIS 야간선물 함수: `recordNightFuturesPrice` 스케줄러, `getKospiNightFutures`, `getKisNightFuturesConfig` callable. KIS 키는 `KIS_APP_KEY`/`KIS_APP_SECRET` Functions secret으로만 받고, `H0UPANC0` WebSocket 체결가를 Firestore `night_futures_prices`에 저장한다. 웹 앱은 Firebase 연결 시 이 컬렉션을 읽어 KOSPI200 야간선물 화면의 가격·히스토리를 갱신한다.
- 이미지 첨부: `storageBucket`이 있으면 게시글과 시황 분석 이미지를 Firebase Storage에 업로드하고 다운로드 URL을 저장한다. Firebase Storage가 없으면 로컬 검증용으로 작은 이미지 data URL을 저장한다.
- Firebase 보안 설정: Firestore rules는 공개 읽기 컬렉션, 공개 사용자 레벨 요약, 사용자 소유 문서, 관리자 전용 추천주/공지/시황/신고함, 공개 매매일지 댓글/좋아요를 분리한다. 공개 게시글, 공개 매매일지, 댓글, 신고 쓰기는 허용 필드와 타입을 제한하고, 공개 매매일지 댓글/좋아요는 일지 공개 상태를 함께 확인한다. 공개 레벨 요약 `user_public/{uid}`와 사용자 하위 컬렉션의 메모, 댓글 인덱스, 차단, 작성자 팔로우, AI 분석 캐시도 앱이 쓰는 payload 형태로 제한한다. 좋아요는 카운터 변경과 사용자별 like 문서 변경을 하나의 transaction으로 처리하고, rules는 `existsAfter()`·`getAfter()`로 최종 상태를 검증해 카운터 단독 증감과 like 문서 단독 변경을 막는다. 새 글과 새 공개 일지의 카운터는 `0`으로 제한하고 일반 수정은 기존 카운터와 작성자 UID를 보존한다. Storage rules는 `posts/{uid}`와 `market_analyses/{uid}`의 이미지 업로드만 허용한다. 관리자 권한은 rules의 기본 UID 목록과 Auth custom claim `{ admin: true }`를 함께 지원하며, `WOOGI_ADMIN_UIDS`는 브라우저의 관리자 화면 표시용 UI 힌트로만 사용한다.
- 시세/검색/차트/시장심리/수급/업종·시장 폭/KOSPI200 야간선물/시장 브리프/펨코 지수/재무/뉴스/공시/종목토론방 프록시: `server.py`의 `/api/quote`, `/api/search`, `/api/history`, `/api/sentiment`, `/api/investor-flow`, `/api/market-sectors`, `/api/night-futures`, `/api/market-brief`, `/api/fmkorea`, `/api/fundamentals`, `/api/news`, `/api/disclosures`, `/api/discussions`, `/healthz`. 프런트는 기본적으로 같은 origin을 쓰고 `WOOGI_API_BASE_URL` 설정 시 별도 API 프록시 origin을 사용한다.
- 국내 종목 현재가/검색/일봉과 KOSPI/KOSDAQ 지수 현재가/일봉은 Naver Finance 경유, 해외 시세와 보조 이력은 Yahoo Finance 경유. Yahoo 요청 제한 시 해외 현재가는 Stooq CSV, 미국 주식 일봉은 Nasdaq historical API fallback을 사용.
- Firebase `market_investor_flow` 문서가 없거나 로컬 검증 모드일 때도 앱 진입 시 `/api/investor-flow`를 호출해 Naver Finance 마감 수급 TOP5를 갱신한다. `investor-flow` 상세 화면은 KOSPI/KOSDAQ 외국인·기관 그룹을 분리하고, 수급 종목을 발견 종목 풀에 등록해 종목 상세로 이어준다.
- `/api/market-sectors`는 Naver Finance 업종별 시세와 Naver 모바일 시총 API 전체 종목을 수집해 업종 상승·하락 TOP3, ETF/ETN 제외 KOSPI·KOSDAQ 상승·하락·보합 종목 수를 반환한다.
- `/api/night-futures`는 원본 KIS OpenAPI 야간선물 단축코드 산정 규칙과 18:00~05:00 KST 세션 상태, KIS 키 설정 여부, 선택적 스냅샷 히스토리를 반환한다. 비밀키가 없으면 `configured:false`/`available:false` 상태로 화면이 연동 대기 UI를 표시하고, 운영 수집기는 Firebase `night_futures_prices`, `WOOGI_NIGHT_FUTURES_SNAPSHOT`, `WOOGI_NIGHT_FUTURES_HISTORY_FILE` 중 하나로 최신 스냅샷을 주입할 수 있다.
- Firebase `ai_briefs/latest` 문서가 없거나 원본 문서가 `brief` 필드만 가진 경우에도 `normalizeAiBrief`로 화면 스키마를 맞추고, 로컬 검증 모드에서는 `/api/market-brief`가 지수, CNN Fear & Greed, 마감 수급, 업종·시장 폭, Google News RSS를 조합해 홈 AI 시장 브리프를 갱신한다.
- Firebase `fmkorea_stock_mentions_realtime/today`, `fmkorea_index` 문서가 없거나 로컬 검증 모드일 때도 `/api/fmkorea`가 공개 게시판 최근 글 수와 대표 종목 별칭 언급을 집계해 실시간 시장 화면의 펨코 지수와 HOT 종목을 갱신한다. `fmkorea-index`는 일별 글 수 추이와 HOT 요약을 표시하고, `fmkorea-hot`은 언급량/게시글 수 기준 HOT 종목 목록과 공유 문구를 제공한다. HOT 목록에 들어온 비seed 종목은 발견 종목 풀에 등록해 상세 진입을 유지한다.
- Yahoo 검색 요청 제한 시에도 유효한 미국 티커는 Stooq 현재가로 직접 확인해 검색 결과를 구성하고, 검색으로 발견한 비seed 종목을 상세 데이터 풀에 등록.
- 국내 재무지표는 Naver Finance, 해외 재무지표는 Yahoo Finance, 국내 뉴스는 Google News RSS, 해외 뉴스는 Yahoo Finance 검색 경유. Yahoo 뉴스가 제한될 때 해외 뉴스도 Google News RSS로 fallback.
- 종목 상세에서 재무·뉴스·공시와 국내 종목 Naver Finance 종목토론방을 자동 조회하고 수동 갱신할 수 있으며, Firebase AI 분석 callable에도 같은 재무·뉴스·공시 스냅샷을 전달.
- Firebase Functions가 없는 로컬 fallback AI 분석도 서버가 조회한 재무·뉴스 스냅샷을 리포트 본문과 근거 자료에 반영. Firebase callable 성공 시에는 `users/{uid}/stock_ai_analyses/{analysisId}`에도 결과를 저장한다.
- 앱 진입 시 시장·추천주 시세, 업종·시장 폭, KOSPI200 야간선물 상태를 자동 조회하고, 종목·지수 상세 진입 시 실제 일봉 차트를 자동 조회. 실패 시 seed/로컬 추정 값을 유지하고 수동 재시도 가능.
- 시장 카드, 추천주/특징주 목록, 종목 상세, 지수 상세에 `LIVE`/`SNAPSHOT` 배지와 데이터 소스/갱신 시각을 표시해 실데이터와 임시 스냅샷을 구분.
- 로컬 fallback seed 추천주는 실제 시세와 괴리된 예전 매수가/목표가가 남아 있으면 현재 검증된 가격 기준으로 자동 보정. Firestore 실제 데이터가 들어오면 원본 추천 데이터를 우선 사용.
- 서버 프록시는 1분 메모리 캐시를 사용해 반복 갱신 중 Naver/Yahoo/Google News 요청 제한과 지연을 줄인다.
- 서버 JSON 응답 헬퍼는 클라이언트가 긴 외부 데이터 요청을 먼저 끊는 경우 헤더/본문 전송 중 발생하는 `BrokenPipeError`를 조용히 정리해 테스트 중 noisy 502 로그와 후속 예외를 막는다.
- 서버 요청 로그도 stderr 파이프가 끊긴 장기 실행 프로세스에서 `BrokenPipeError`가 HTTP 응답을 빈 응답으로 만들지 않도록 방어한다.
- 펨코 공개 게시판은 반복 접근 시 보안 시스템 응답을 줄 수 있다. `/api/fmkorea`는 요청량을 제한하고 마지막 정상 스냅샷을 유지하며, 정상 스냅샷이 아직 없으면 화면에 연결 제한 상태를 표시하고 기존 로컬/Firebase 데이터를 보존한다.
- 시장 심리 상세: `/api/sentiment`가 CNN Fear & Greed를 서버에서 조회하고, 상세 화면은 `/api/quote` 프록시로 VIX, 미 10년/3개월 국채금리, 달러 인덱스, 구리, 금을 갱신한다.

## 검증 결과

- `node --check src/app.js`: 성공.
- `node tests/local-regression-check.mjs`: 성공. CDP를 제외한 문법, 정적 계약, Functions helper, 파서, 서버 로그 방어, 배포 계약, advisory readiness를 순차 실행.
- `node tests/final-regression-check.mjs`: 성공. 시작 전에 `server.py` `/healthz`와 CDP Chrome 포트를 확인한 뒤, live API smoke가 포함된 로컬 회귀와 CDP 브라우저 회귀 11종을 한 번에 순차 실행. CDP가 없을 때는 실패 메시지와 README가 macOS Chrome `--remote-debugging-port=9223` 실행 예시를 안내한다. 운영 배포 직전에는 `--strict`를 추가하면 내부 readiness 경고 중 운영 필수 항목이 실패로 승격된다.
- `node --check functions/index.js`, `node --check functions/analysis.js`, `node --check functions/nightFutures.js`: 성공. Functions 진입점, AI 분석 helper, KIS 야간선물 helper의 문법을 확인.
- `PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile server.py`: 성공.
- `node tests/static-check.mjs`: 성공. Firebase rules/indexes/storage/functions 설정 파일 존재, 관리자 UID/claim, 공개 사용자 레벨 `user_public`, 게시글·시황 이미지 Storage 경로, 좋아요 카운터 +1/-1 제약과 like 문서 payload 제한, 공개/개인 매매일지 composite index를 확인.
- `node tests/firestore-like-integrity-check.mjs`: 성공. 게시글·공개 일지 좋아요의 transaction, 초기 카운터 `0`, 일반 수정 카운터·작성자 UID 보존, `existsAfter()`·`getAfter()` 최종 상태 검증을 확인.
- `node tests/firestore-write-schema-check.mjs`: 성공. 공개 게시글, 공개 매매일지, 댓글, 신고 쓰기 rules의 필드 화이트리스트, 타입 가드, 클라이언트 write payload 정합성을 확인.
- `node tests/firestore-user-schema-check.mjs`: 성공. 공개 사용자 레벨 요약, 사용자 메모, 댓글 인덱스, 차단, 작성자 팔로우, AI 분석 캐시 rules와 클라이언트 write payload 정합성을 확인.
- `node tests/functions-analysis-check.mjs`: 성공. Functions deterministic 분석 fallback, OpenAI prompt 구성, Responses API 출력 텍스트 JSON 파싱, 클라이언트 분석 스키마 병합을 확인.
- `node tests/functions-provider-config-check.mjs`: 성공. `getMarketProviderConfig`가 OpenAI/DART/KIS secret을 raw value로 반환하지 않고 boolean 상태만 반환하는지 확인.
- `node tests/functions-night-futures-check.mjs`: 성공. KIS 야간선물 단축코드 만기 전환, 야간 세션 판정, `H0UPANC0` 체결 메시지 파싱을 확인.
- `PYTHONPYCACHEPREFIX=/tmp python3 tests/server-log-message-check.py`: 성공. stderr 파이프가 끊겨도 서버 요청 로그가 HTTP 응답 처리를 깨지 않는지 확인.
- `PYTHONPYCACHEPREFIX=/tmp python3 tests/server-browser-config-check.py`: 성공. Cloud Run 환경 변수에서 브라우저용 Firebase 설정과 관리자 UID를 만들고 OpenAI/DART/KIS 시크릿은 노출하지 않는지 확인.
- `PYTHONPYCACHEPREFIX=/tmp python3 tests/server-security-headers-check.py`: 성공. CSP, 프록시 공통 보안 헤더와 서버 식별자 축소를 확인.
- `python3 tests/fmkorea-parser-check.py`: 성공. 공개 게시판 HTML의 공지 제외, 일별 글 수, 대표 종목 별칭, KOSDAQ 시장 분류 파싱을 확인.
- `node tests/night-futures-normalize-check.mjs`: 성공. KOSPI200 야간선물 프런트 정규화가 `null`/`0` 가격을 스냅샷 있음으로 오판하지 않고, 양수 스냅샷만 가용 상태로 표시하는지 확인.
- `python3 tests/naver-market-sectors-parser-check.py`: 성공. Naver Finance 업종표 파싱, 업종명 중복 제거, ETF/ETN 제외 시장 폭 집계를 확인.
- `node tests/deployment-check.mjs`: 성공. Cloud Run용 Dockerfile, 비권한 `appuser`, `.dockerignore`의 로컬/민감/테스트 산출물 제외, `WOOGI_HOST`/`PORT` 서버 바인딩, `/healthz`, 동적 `/config.local.js`, 공통 보안 헤더 경로를 확인.
- `node tests/production-readiness-env-check.mjs`: 성공. Cloud Run의 `WOOGI_FIREBASE_*` 환경 변수만으로 브라우저용 Firebase 설정이 준비 상태로 판정되는지 확인.
- `node tests/production-readiness-check.mjs`: 성공. 배포 산출물, 예시 Firebase 설정, Functions callable/secret scaffold, Docker/서버 설정을 확인하고 실제 운영값이 필요한 항목은 advisory 경고로 분리.
- `node tests/api-smoke-check.mjs`: 성공. 삼성전자 Naver 시세·재무·뉴스·공시·종목토론방, 삼성전자 Naver 5년 일봉 1,000개 이상, KOSPI Naver 일봉, CNN 시장심리, 서버 AI 시장 브리프, Naver 마감 수급 TOP5, Naver 업종·시장 폭, 공개 게시판 펨코 지수, AAPL 검색·Yahoo/Stooq 현재가·Nasdaq 일봉을 한 번에 확인.
- `node tests/server-http-contract-check.mjs`: 성공. 실행 중인 프록시의 정적 응답, `/healthz`, `/config.local.js`, 동적 경로 `HEAD`, no-store, CSP와 공통 보안 헤더를 확인.
- `node tests/cdp-market-source-check.mjs`: 성공. 홈 시장 카드 LIVE 전환과 서버 AI 시장 브리프 갱신, 실시간 시장 화면의 Naver 마감 수급 TOP5, 마감 수급 상세의 KOSPI/KOSDAQ 외국인·기관 그룹과 공유 문구, 펨코지수 상세의 게시글 수 추이 차트와 펨코 HOT 상세의 종목 목록/공유 문구, 업종 등락·ETF/ETN 제외 시장 폭과 `fmkorea.com/stock` 공개 게시판 집계, 시장 심리 상세의 VIX·미 10년/3개월 국채금리·달러 인덱스·구리·금 지표 6개, KOSPI200 야간선물 연동 대기/스냅샷 대기 상태, KOSPI 상세 Naver 일봉, 삼성전자 상세 Naver 현재가/실제 OHLC 캔들·이동평균선·라인 전환과 공시·종목토론방 출처, 태블릿 885px·모바일 390px 가로 오버플로 없음 확인.
- `node tests/cdp-deep-link-check.mjs`: 성공. 직접 URL `/stock/KS_005930`, `/post/post_001`, `/journal-share/journal_001`, `/index/%5EKS11`와 원본 alias `/pick/pick_samsung`, `/analysis/market_001` 진입, 모바일 오버플로 없음 확인.
- `node tests/cdp-ai-check.mjs`: 성공. 삼성전자 AI 분석 결과의 실제 재무·뉴스 근거와 화면 오버플로 확인.
- `node tests/cdp-local-flows-check.mjs`: 성공. 이메일 회원가입, KST 일일 출석 카운트, 추천주 관심등록, 일반 관심종목 추가, 종목 메모, 종목 댓글, 매매일지 작성/수정/삭제, 커뮤니티 글/댓글/좋아요/신고, 모바일 프로필 오버플로 없음 확인.
- `node tests/cdp-run-all.mjs`: 성공. 시장/딥링크/AI/로컬 흐름/관리자/검색/시황/커뮤니티/공개일지/매매일지 차트/보조기능 CDP 회귀 11개를 연속 실행해 통과 확인.
- `node tests/cdp-admin-auth-search-check.mjs`: 성공. 관리자 추천주 추가, 고정 공지 작성, 신고함 삭제, 회원 관리 검색/상세, 로그아웃 후 재로그인, 글로벌 검색, 종목 검색, 관심 해제, 모바일 관리자 화면 오버플로 없음 확인.
- `node tests/cdp-discovered-search-check.mjs`: 성공. seed에 없는 AAPL을 글로벌 검색해 상세로 이동하고 Yahoo/Stooq 현재가, Nasdaq 일봉 143개, 데스크톱·모바일 가로 오버플로 없음 확인.
- `node tests/cdp-market-analysis-check.mjs`: 성공. 시황 분석 상세, 이미지 첨부, 댓글 등록, 관리자 작성/수정/삭제, 모바일 오버플로 없음 확인.
- `node tests/cdp-community-detail-check.mjs`: 성공. 커뮤니티 게시글 상세 이동, 이미지 첨부, 글 수정, 댓글 작성/삭제, 내 글/내 댓글 화면, 작성자 팔로우, 작성자 차단 후 목록 숨김, 게시글 삭제, 오버플로 없음 확인.
- `node tests/cdp-journal-share-check.mjs`: 성공. 공개 매매일지 상세 이동, 좋아요 토글, 댓글 작성/삭제, 내 댓글 화면 연동, 작성자 차단 후 목록 숨김, 오버플로 없음 확인.
- `node tests/cdp-journal-chart-check.mjs`: 성공. 삼성전자 매매일지에서 종목별 차트 진입, Naver Finance 6개월 실제 일봉 100개 이상, 매수 마커, 거래 이벤트, 데스크톱·모바일 캔들 픽셀 렌더링과 가로 오버플로 없음 확인.
- `node tests/cdp-secondary-features-check.mjs`: 성공. 특징주 상세의 포착 정보, 실제 일봉 차트, 연결 작업, 보유 현황 현재가 갱신, 종목 비교 3개 카드, 3개 시리즈 통합 수익률 차트 픽셀 렌더링, 6개 기간 버튼과 `5Y` 전환, 종료 추천주 실적 현대차 표시, 모바일 오버플로 없음 확인.
- `node tests/cdp-run-all.mjs`: 성공. CDP 검증 11종을 순차 실행한다. 같은 origin의 `localStorage` 충돌을 피하기 위해 병렬 실행하지 않도록 정리했고, 각 테스트 전후 앱 탭을 정리하되 headless Chrome이 종료되지 않도록 `about:blank` keeper 탭을 유지.
- 로컬 서버 실행: 성공.
- 데스크톱 1440x900, 태블릿 1024x768, 모바일 390x844 렌더링 확인: 가로 오버플로 없음.
- 로그인/회원가입, 관심등록, 일반 관심종목 추가, 메모 저장, AI 분석 생성/결과 이동, 매매일지 작성, 커뮤니티 글/댓글/좋아요/신고 확인.
- 로컬 쓰기 검증 상세: `qa-*.local` 테스트 계정으로 `KS_005930`, `US_TSLA` 관심종목 저장, `KS_005930` 메모 저장, 댓글 카운트 2개, 게시글 1개, 신고 1개, 매매일지 삭제 후 잔존 없음 확인.
- 시세 새로고침 버튼: `/api/quote` 경유 완료 토스트 확인.
- 앱 첫 진입 자동 갱신: 2026-06-01 11:02 KST 기준 별도 클릭 없이 KOSPI `8,849.25 (+4.40%)`, KOSDAQ `1,052.68 (-2.06%)` 반영 확인.
- 데이터 출처 표시: 홈 시장 카드가 비동기 갱신 후 `SNAPSHOT`에서 `LIVE / Naver Finance·Stooq·Yahoo Finance`로 전환되는 것을 CDP로 확인.
- 로컬 seed 보정: 2026-06-01 장중 확인값 기준 삼성전자 `347,000원 / 목표 355,000원`, SK하이닉스 `2,393,000원 / 목표 2,550,000원`, NAVER `259,000원 / 목표 262,000원`, 한미반도체 특징주 `290,000원 (+2.84%)` 스냅샷 반영.
- 해외 fallback 시세: NVDA `$211.1`, TSLA `$435.8`, S&P 500 `7,580.1`, NASDAQ `26,972.6`, USD/KRW `1,503.1`, NASDAQ100 선물 `30,388.3`, WTI `87.36` 반영 확인.
- 해외 뉴스 fallback: NVIDIA 상세에서 Google News RSS 기반 기사 5건 표시 확인. Yahoo 재무/차트가 429일 때 재무는 빈 값 유지, 뉴스는 fallback으로 표시.
- 해외 차트 fallback: NVDA `/api/history`가 Nasdaq historical API 기준 일봉 143개, 첫 종가 `$206.88`, 마지막 종가 `$211.14`를 반환하고, 상세 화면 차트 `data-values`에도 실제 일봉이 반영되는 것을 확인.
- 미국 티커 검색 fallback: Yahoo 검색이 가능하면 Yahoo 결과를 쓰고, 제한 상태에서는 Stooq 검증 결과를 반환한다. AAPL 상세가 `$312.06`, Yahoo/Stooq 현재가, Nasdaq 일봉 143개를 표시하는 것을 CDP로 확인.
- 종목 상세 실제 재무·뉴스·공시: 2026-06-01 장중 삼성전자 Naver 재무 `PER 28.09`, `PBR 4.83`, `선행 PER 8.06`, `시가총액 2,031.6조`, Google News RSS 기사 5건, Naver Finance 공시 목록 반영 확인.
- 종목 상세 차트: 국내 종목 `/api/history` Naver 일봉 280개 자동 갱신, 삼성전자 장중 현재가 `347,000원` 반영 확인. 수동 갱신 토스트도 확인.
- AI 분석 결과: CDP 기반 클릭 검증(`node tests/cdp-ai-check.mjs`)으로 삼성전자 로컬 AI 리포트가 Naver Finance 출처의 양수 PER/PBR, 최근 근거 뉴스 5건, 재무 근거 배지를 표시하고 가로 오버플로가 없음을 확인. 실시간 재무값 변동을 허용하도록 검증식을 구성.
- AI 분석 생성 안정화: 상세 화면의 재무·뉴스 자동 갱신이 진행 중일 때 AI 분석 버튼을 즉시 눌러도 실제 근거를 분석에 반영하도록 보강. 재무·뉴스·공시 API는 병렬 호출하고 각 요청에 8초 timeout을 적용해 외부 지연이 `#ai/{stock}` 라우팅을 막지 않도록 했다.
- 시장 새로고침: KOSPI/KOSDAQ Naver 지수 값, USD/KRW, CNN Fear & Greed 반영 확인.
- 지수 상세: KOSPI 상세 진입과 `/api/history?ticker=^KS11` Naver 일봉 차트 갱신 확인.
- 관리자: 로컬 이메일 관리자 계정으로 신고함 노출, 공지 작성, 추천주 추가, 회원 검색/상세 확인.
- 관리자 자동 검증 상세: `admin@*.woogi.local` 테스트 계정으로 관리자 권한 부여, 회원 관리 검색/상세, 신고 접수/삭제, 추천주 추가, 고정 공지 저장, 로그아웃/재로그인 후 관리자 권한 유지 확인.
- 시황 분석 자동 검증 상세: `admin@market-*.woogi.local` 테스트 계정으로 seed 시황 상세 댓글 등록, 새 시황 작성, 이미지 첨부, 제목 수정, 삭제, 모바일 상세 오버플로 없음 확인.
- 커뮤니티 상세 자동 검증 상세: `community-*.woogi.local` 테스트 계정으로 글 작성, 이미지 첨부, 상세 진입, 글 수정, 댓글 작성/삭제, 내 글/내 댓글 진입, seed 작성자 팔로우, 차단 후 목록 숨김, 게시글 삭제 확인.
- 공개 매매일지 자동 검증 상세: `journal-share-*.woogi.local` 테스트 계정으로 seed 공개 매매일지 상세 진입, 좋아요, 댓글 작성/삭제, 내 댓글 노출, 작성자 차단 후 목록 숨김 확인.
- 원본 부가 화면 보강: `portfolio`, `compare`, `leaderboard` 라우트를 추가하고 매매일지 집계, 최대 5년 프록시 일봉 기반 통합 수익률 비교, 완료 추천주 실적 순위를 실제 화면과 CDP 검증에 연결.
- 원본 특징주 상세 보강: `feature-stock` 라우트를 추가하고 포착 사유, 실제 일봉 차트, 거래대금/거래량 배수/포착 점수, 종목토론방과 종목 상세/AI 분석 연결을 CDP 검증에 포함.
- 원본 매매일지 차트 보강: `journal-chart` 라우트를 추가하고 6개월 실제 OHLC 일봉, 거래일 기준 5일 이내 최근접 매수/매도 마커, 요약 지표와 거래 이벤트를 캔버스 화면 및 CDP 검증에 연결.
- 원본 종목 상세 차트 보강: 종목 상세 기본 차트를 종가 라인에서 실제 OHLC 캔들로 바꾸고 `MA5`·`MA20`·`MA60` 이동평균선과 라인 전환을 추가.
- 원본 마감 수급 상세 보강: `investor-flow` 라우트를 추가하고 KOSPI/KOSDAQ 외국인·기관 순매수 TOP5, 공유 문구 복사, 수급 종목 상세 진입을 CDP 검증에 연결.
- 원본 펨코 상세 보강: `fmkorea-index`, `fmkorea-hot` 라우트를 추가하고 게시글 수 추이, HOT 종목 목록, 공유 문구 복사, HOT 종목 상세 진입을 CDP 검증에 연결.
- 원본 시장 심리 상세 보강: `market-sentiment` 라우트를 추가하고 CNN Fear & Greed, VIX, 금리, 달러, 구리, 금 지표를 현재가 프록시와 CDP 검증에 연결.
- 원본 딥링크 보강: `DeepLinkService`의 `/pick/{id}`, `/analysis/{id}` alias를 웹 직접 URL로 복원하고, 공유 URL 형태의 종목/게시글/공개 일지/지수 상세 진입을 검증에 포함. 원격 `stock_picks`가 seed 추천주 id를 대체해도 `/pick/pick_samsung` 같은 기존 공유 링크는 fallback 추천주 스냅샷으로 상세 진입을 유지한다.
- 확인 스크린샷: `screenshots/desktop-home.png`, `screenshots/desktop-markets.png`, `screenshots/desktop-kospi.png`, `screenshots/desktop-stock-live-viewport.png`, `screenshots/stock-candles-desktop.png`, `screenshots/stock-candles-mobile.png`, `screenshots/desktop-compare-overlay.png`, `screenshots/mobile-compare-overlay.png`, `screenshots/journal-chart-desktop.png`, `screenshots/journal-chart-mobile.png`, `screenshots/tablet-capture.png`, `screenshots/tablet-index.png`, `screenshots/tablet-stock-live-viewport.png`, `screenshots/mobile-journal.png`, `screenshots/mobile-profile.png`, `screenshots/mobile-stock-live-viewport.png`.

## 미복원/제한 사항

- 실제 Firebase 프로젝트 설정 파일은 포함하지 않았다.
  - 이유: Firebase 키를 하드코딩하지 말라는 요구사항.
  - 대체안: 로컬은 `config.local.js`, Cloud Run은 `WOOGI_FIREBASE_*` 환경 변수로 브라우저용 값을 주입.
  - 다음 작업: Firebase 웹 앱 등록값과 도메인 허용 설정 추가.
- OpenAI/DART/KIS 실분석은 클라이언트에 키를 넣지 않고 Cloud Functions에서만 처리하도록 남겼다.
  - 이유: 시크릿은 서버/Functions에만 있어야 한다.
  - 대체안: `functions/`의 `generateStockAiAnalysis` callable scaffold, `getMarketProviderConfig` secret 상태 callable, 로컬 분석 fallback 제공.
  - 다음 작업: Functions 배포, `OPENAI_API_KEY` secret 설정, DART/KIS 공급자 연결 후 실제 호출 검증.
- Yahoo Finance는 환경 또는 시점에 따라 요청 제한(`429`)이 발생할 수 있다.
  - 이유: 공개 Yahoo 엔드포인트의 호출 제한.
  - 대체안: 국내 시세·일봉·재무는 Naver 우선 사용, 해외 현재가는 Stooq fallback 사용, 실패 시 기존 값 유지.
  - 다음 작업: 운영 프록시에 캐시와 요청 제한 완화 정책을 추가하고 해외 시세 공급자를 확정.
- Firebase rules/indexes/functions는 저장소에 포함했지만 실제 프로젝트 배포 검증은 남아 있다.
  - 이유: 현재 저장소에는 프로젝트 ID, 실제 Firebase Web App 설정, 배포 권한을 포함하지 않았고 이 실행 환경에는 Firebase CLI/npm/npx가 없다.
  - 대체안: `firebase deploy --only firestore:rules,firestore:indexes,storage,functions`로 배포 가능한 설정 파일을 제공하고, `storageBucket`이 없는 로컬 환경에서는 작은 이미지 data URL fallback으로 첨부 흐름을 검증한다. `WOOGI_APP_URL=... node tests/production-readiness-check.mjs --strict`로 실제 프로젝트/CLI/헬스체크 준비 여부를 배포 직전에 실패 조건으로 점검할 수 있다.
  - 다음 작업: 운영 프로젝트 선택 후 rules/indexes/functions 배포, Firebase Auth custom claim 또는 관리자 UID 설정, 실제 업로드/AI 호출 권한 검증.

## 추가 설정 필요

- Firebase Web App 설정을 로컬 `config.local.js` 또는 Cloud Run `WOOGI_FIREBASE_*` 환경 변수에 입력.
- Firebase Auth 이메일/비밀번호 로그인 활성화.
- Firestore rules/indexes와 Firebase Storage rules 배포 및 웹 도메인 허용.
- Cloud Functions `asia-northeast3` 배포.
- Functions secrets: `OPENAI_API_KEY`, `DART_API_KEY`, KIS 관련 키.
- 운영 배포 시 `Dockerfile` 기반 Cloud Run 또는 별도 API 서버로 `server.py` 프록시를 이관하고 운영 도메인을 연결.
