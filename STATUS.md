# 별빚도장 — STATUS

> **별빛이 되는 순간까지** · 빚을 빛으로 바꾸는 PWA
> 시작 2026-05-08 · 출시·OCR·공유 2026-05-09 · 보안·아이콘·알림·신용회복 2026-05-09 저녁
> 위치 `D:\byeolbit\` · 깃 `jaewonhyeon9-ctrl/byeolbit` · 배포 https://byeolbit-pearl.vercel.app

## 콘셉트

- **별빚 ↔ 별빛** 워드플레이로 부채를 부끄러움이 아닌 우주적/시적 대상으로 재정의
- 도장깨기 메커니즘: 빚 잔액 0 도달 시 도장에 균열 → 별빛 폭발 애니메이션
- 영성 결(우주님의 말버릇 책 영감, 본문/캐릭터 직인용 X)
- 사용자 본인이 1차 dogfood (4억 부채/신용불량자 직접 사용)

## 스택

- Next.js 16.2.6 · React 19 · TypeScript · Tailwind v4 · Pretendard
- 데이터: **localStorage 우선** (민감정보 클라우드 회피)
- Vercel 배포 (git push 자동) · Upstash Redis (공유 링크용)
- Gemini 2.5 Flash (OCR — 부채 1건/가계부 다항목)
- 테마: 베이지 + 어스톤 (sage/honey/clay)

## 라우트 (21개)

| Path | 기능 |
|------|------|
| `/` | 홈 — 합계, 분류 바, 오늘 메시지, 별빚 도장 그리드 |
| `/debts` | 별빚 목록 (눈사태/눈덩이) |
| `/debts/new` | 별빚 등록 (자동분류 + OCR + Ctrl+V) |
| `/debts/[id]` | 별빚 상세 + 결제 기록 + 도장깨기 애니메이션 |
| `/plan` | 월 정한 금액 시뮬레이션 + 빚별 깨지는 시점 |
| `/insights` | 오늘 메시지 + 도구 허브 + **카테고리 필터 + 카드 30개** |
| `/principles` | 빚 깨기 위한 원칙 15가지 (예시 채우기) |
| `/routine` | 빚 줄이기 시간대별 일과표 |
| `/calendar` | 지출 캘린더 (전 주기 자동 표시 + OCR 가져오기) |
| `/spending` | 지출 온도 분석 + 카테고리 + 14일 흐름 + TOP 5 |
| `/recovery` | **신용회복 길잡이 — 워크아웃·개인회생·파산·무료상담** |
| `/mandalart` | **만다라트 9×9 → AI가 아이젠하워 4분면으로 자동 분류** |
| `/settings` | 백업/복원, 엑셀/PDF, 공유 링크, 알림, 위험구역 |
| `/report` | 인쇄 전용 깔끔 리포트 (PDF 저장) |
| `/share/[id]` | E2E 암호화 공유 링크 읽기 전용 뷰 |
| `/api/ocr/extract-debt` | 단일 부채 OCR (rate limit 10/분, 6MB 한도) |
| `/api/ocr/extract-expenses` | 가계부 다항목 OCR (rate limit 10/분, 6MB 한도) |
| `/api/ai/eisenhower` | **만다라트 → 4분면 자동 분류 (Gemini Flash, rate limit 10/분)** |
| `/api/share/create` | 공유 링크 발급 (rate limit 20/시간) |
| `/api/share/[id]` | 공유 데이터 조회 |

## 데이터 모델

- `Debt`: 이름, 카테고리(12 — 외상·미지급금 포함), 잔액, 이율, 회당 상환, 분류(긍정/중립/부정), 상환주기(월/주/일/영업일), 상환일, 메모, 완납여부
- `Payment`: 빚ID, 금액, 날짜, 메모
- `ScheduledExpense`: 이름, 금액, 날짜, 카테고리(12), 완납여부, source(manual/ocr)
- `RoutineItem`: 시간(HH:MM), 활동
- `principles`: string[15]
- `MandalartState`: 9×9 cells (string[][]) + 마지막 AI 분류 매트릭스 + 생성 시각 (세부목표 8칸 ↔ 바깥 블록 중심 자동 mirror)
- `Settings`: 전략, insightSeed, streak

## 환경변수 (Vercel 등록 완료)

- `GEMINI_API_KEY` — Gemini Flash OCR
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` — Upstash Redis (Marketplace 자동 주입)

⚠ Gemini 키는 채팅 노출 이력 있어 출시 전 rotate 권장.

## 다음 우선순위

1. **본격 dogfood** — 4억 데이터 입력 후 어색한 부분 잡기 (사용자 작업)
2. **본인 도메인 + AdSense 신청** (Cloudflare Registrar 등 1.2만 원/년)
3. **인사이트 30 → 60개로 확장** (사용자 반응 보고)
4. **알림 정밀화** — 시간 지정 (예: 매일 09:00), 무음 시간대
5. **클라우드 동기화** (사용자 100명 이상 시점)

## 2026-05-09 저녁 추가 작업 (자율 진행)

- **OCR rate limit + 이미지 크기 검증** — Upstash INCR 기반, 분당 10회·6MB 상한
- **외상매입금/미지급금** 카테고리 추가 (사업자용)
- **인사이트 카드 30개** + 5개 카테고리 (마인드/실행/소비/관계/회복) + 필터 UI
- **신용회복 길잡이 페이지** (`/recovery`) — 워크아웃/개인회생/파산/사채 대응 + 무료 상담 번호 5종
- **PWA 아이콘** — 별 도장 SVG → 192/512/180 PNG 자동 생성 (`scripts/build-icons.mjs`, sharp)
- **알림** — Service Worker(`/sw.js`) + 로컬 Notification API. 앱 열 때 오늘 메시지 + 상환일 별빚 1회 알림. 설정에서 토글

## 보류 (필요 시 추가)

- **클라우드 동기화** (Neon free 또는 Supabase Pro) — 사용자 100명 이상 시점
- **카카오 소셜 로그인** — 진입장벽 낮추려면 익명 사용 유지가 더 나을 수 있음
- **푸드테크/POS 매출 연동** — 식당 사업자 통합 (오토드림 결과 보고 결정)

## 주요 결정 이력

- 2026-05-08: 별빚도장 이름 확정 ("별빚→별빛" 워드플레이)
- 2026-05-08: 베이지/어스톤 테마로 전환 (다크 코스믹 폐기)
- 2026-05-08: localStorage 유지 + JSON 백업/복원 + 공유 링크 조합으로 출시
- 2026-05-09: Upstash Redis로 공유 링크 백엔드 추가
- 2026-05-09: 가계부 OCR + 지출 온도 분석 추가
- 2026-05-09 저녁: OCR rate limit, 외상·미지급금 카테고리, 인사이트 30개, 신용회복 페이지, PWA 아이콘, 로컬 알림 일괄 추가
- 2026-05-09 저녁: 만다라트(9×9) → 아이젠하워 매트릭스 자동 분류 추가 (Gemini Flash, q1~q4 + 분류 근거)

## 스크립트

```bash
cd /d/byeolbit
npm run dev      # 개발 서버 (Turbopack, port 3000)
npm run build    # 프로덕션 빌드 (TS 타입 체크 포함)
npm run lint     # ESLint
```

## 배포 워크플로

```bash
git -c safe.directory=D:/byeolbit add -A
git -c safe.directory=D:/byeolbit commit -m "..."
git -c safe.directory=D:/byeolbit push
# → Vercel 자동 배포 (1~2분)
```

(매번 `safe.directory` 치기 귀찮으면 `git config --global --add safe.directory D:/byeolbit` 한 번만 실행)
