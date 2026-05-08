# 별빚도장 — STATUS

> **별빛이 되는 순간까지** · 빚을 빛으로 바꾸는 PWA
> 시작 2026-05-08 · 출시·OCR·공유까지 완성 2026-05-09
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

## 라우트 (18개)

| Path | 기능 |
|------|------|
| `/` | 홈 — 합계, 분류 바, 오늘 메시지, 별빚 도장 그리드 |
| `/debts` | 별빚 목록 (눈사태/눈덩이) |
| `/debts/new` | 별빚 등록 (자동분류 + OCR + Ctrl+V) |
| `/debts/[id]` | 별빚 상세 + 결제 기록 + 도장깨기 애니메이션 |
| `/plan` | 월 정한 금액 시뮬레이션 + 빚별 깨지는 시점 |
| `/insights` | 오늘 메시지 + 도구 허브 (원칙/일과/캘린더/온도) + 전체 카드 15개 |
| `/principles` | 빚 깨기 위한 원칙 15가지 (예시 채우기) |
| `/routine` | 빚 줄이기 시간대별 일과표 |
| `/calendar` | 지출 캘린더 (전 주기 자동 표시 + OCR 가져오기) |
| `/spending` | 지출 온도 분석 + 카테고리 + 14일 흐름 + TOP 5 |
| `/settings` | 백업/복원, 엑셀/PDF, 공유 링크, 위험구역 |
| `/report` | 인쇄 전용 깔끔 리포트 (PDF 저장) |
| `/share/[id]` | E2E 암호화 공유 링크 읽기 전용 뷰 |
| `/api/ocr/extract-debt` | 단일 부채 OCR |
| `/api/ocr/extract-expenses` | 가계부 다항목 OCR |
| `/api/share/create` | 공유 링크 발급 |
| `/api/share/[id]` | 공유 데이터 조회 |

## 데이터 모델

- `Debt`: 이름, 카테고리(11), 잔액, 이율, 회당 상환, 분류(긍정/중립/부정), 상환주기(월/주/일/영업일), 상환일, 메모, 완납여부
- `Payment`: 빚ID, 금액, 날짜, 메모
- `ScheduledExpense`: 이름, 금액, 날짜, 카테고리(12), 완납여부, source(manual/ocr)
- `RoutineItem`: 시간(HH:MM), 활동
- `principles`: string[15]
- `Settings`: 전략, insightSeed, streak

## 환경변수 (Vercel 등록 완료)

- `GEMINI_API_KEY` — Gemini Flash OCR
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` — Upstash Redis (Marketplace 자동 주입)

⚠ Gemini 키는 채팅 노출 이력 있어 출시 전 rotate 권장.

## 다음 우선순위 (출시 향한 작업)

1. **PWA 아이콘** (`public/icon-192.png`, `icon-512.png`) — 별 도장 그라데이션, AI 생성 추천
2. **본격 dogfood** — 4억 데이터 입력 후 어색한 부분 잡기
3. **신용회복 정보 페이지** — AdSense 콘텐츠 + 신용불량자 사용자 가치
4. **인사이트 카드 30개로 확장** + 카테고리 분류
5. **푸시 알림** (PWA Web Push) — 매일 인사이트 + 상환일 D-1
6. **외상매입금/미지급금 카테고리** — 사업자 사용자용 (식당 운영하시는 분 대상)
7. **rate limit + 이미지 크기 검증** (OCR 엔드포인트 — 출시 전 필수)
8. **본인 도메인 + AdSense 신청** (Cloudflare Registrar 등 1.2만 원/년)

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
