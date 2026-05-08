# 별빚도장 — STATUS

> **별빛이 되는 순간까지** · 빚을 빛으로 바꾸는 PWA
> 시작일: 2026-05-08 · 위치: `D:\byeolbit\`

## 콘셉트

- **별빚 ↔ 별빛** 워드플레이로 부채를 부끄러움이 아닌 우주적/시적 대상으로 재정의
- 핵심 메커니즘: 빚을 "도장"으로 시각화 → 갚을 때마다 도장이 깨지고 별빛으로 변환
- 영성 결(우주님의 말버릇 책 영감, 본문/캐릭터 직인용 X)
- 사용자 본인이 1차 dogfood

## 스택

- Next.js 16.2.6 · React 19 · TypeScript · Tailwind v4
- 상태/저장: **localStorage 우선** (민감정보 클라우드 회피)
- 배포 예정: Vercel (git push 자동 배포)
- 도메인: 미정 (`byeolbit.com` / `byeolbit.kr` 후보)

## 진행 상황

### ✅ 완성 (MVP scaffold)

**라이브러리 (`src/lib/`)**
- `types.ts` — Debt / Payment / Settings 타입
- `format.ts` — 한국어 금액 포맷 (4억 1천만원 등)
- `classifier.ts` — 긍정/중립/부정 자동 분류 + 카테고리 라벨 + 색상 톤
- `storage.ts` — localStorage 래퍼 (debts/payments/settings)
- `calculator.ts` — 총 부채/평균이율/상환개월/우선순위 정렬
- `insights.ts` — 마인드셋 카드 15개 + 일일 선택 함수

**컴포넌트 (`src/components/`)**
- `StarryBackground.tsx` — 결정론적 별 60개 트윙클
- `BottomNav.tsx` — 4탭 (홈/별빚/플랜/오늘)
- `DojangSeal.tsx` — 별 모양 도장 (홈 그리드용)
- `DebtCard.tsx` — 빚 목록 카드

**페이지 (`src/app/`)**
- `page.tsx` (홈) — 합계/분류 바/오늘의 메시지/별빚 도장 그리드 + 빈 상태
- `debts/page.tsx` — 별빚 목록 (눈덩이/눈사태 토글)
- `debts/new/page.tsx` — 별빚 추가 (자동 분류 미리보기 + 수동 override)
- `plan/page.tsx` — 상환 플랜 + 시뮬레이션 슬라이더 + 우선순위 리스트
- `insights/page.tsx` — 오늘의 메시지 + 전체 인사이트 15개

**기타**
- `globals.css` — 우주 테마 (다크 네이비/보라/골드, 트윙클 애니메이션)
- `layout.tsx` — 한국어 메타데이터, 모바일 우선 max-w-md
- `public/manifest.json` — PWA 매니페스트 (아이콘 파일은 미생성)

## 🚧 다음 단계 (우선순위 순)

1. **dev 서버 띄우고 첫 화면 확인** — `cd D:/byeolbit && npm run dev`
2. **PWA 아이콘 생성** — `public/icon-192.png`, `icon-512.png` (별 모양 그라데이션, AI 생성 추천)
3. **별빚 상세/편집 페이지** — `/debts/[id]/page.tsx` (현재 카드 클릭 시 무반응)
4. **결제 기록 기능** — Payment 타입은 있으나 UI 없음. "오늘 N만원 갚기" 버튼 → 도장 깨지는 애니메이션
5. **도장 깨지기 애니메이션** — 완납 시 SVG seal-crack + 별빛 폭발 효과
6. **수입/지출 입력** — 사용자 요청 기능. "얼마 더 벌어야"/"무엇 덜 써야" 분석을 위해 필요.
7. **신용회복 정보 페이지** — AdSense 콘텐츠 가치 + 신용불량자 사용자 대상
8. **인사이트 카드 30개로 확장** + 카테고리 (감사/풍요/자기자비/실전 팁)
9. **푸시 알림** — 매일 인사이트 알림 (PWA Web Push)
10. **백업/복원** — JSON export/import (localStorage 잃을 위험 대비)

## 💡 기억할 것

- **저작권**: 우주님 책 본문/캐릭터/명칭 직인용 금지. 일반 영성 개념만 자체 언어로.
- **민감정보**: 4억 같은 사용자 데이터는 코드/주석/외부 노출 X. localStorage 유지.
- **AdSense 승인** 위해 도메인 + 콘텐츠 페이지 최소 5~10개 필요. 신용회복/부채 관리 팁 글이 그 역할.
- **배포 워크플로**: Vercel git push 자동. CLI deploy 금지.

## 📂 스크립트

```bash
cd /d/byeolbit
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```
