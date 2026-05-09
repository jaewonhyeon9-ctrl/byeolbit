import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '신용회복 길잡이 — 별빚도장',
  description:
    '신용회복위원회 워크아웃, 개인회생, 개인파산, 사전채무조정 등 한국에서 빚을 정리하는 공식 제도와 무료 상담 창구를 한눈에 정리했습니다.',
};

export default function RecoveryPage() {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <Link href="/insights" className="text-xs text-ink-soft hover:text-ink">
          ← 오늘
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">신용회복 길잡이</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          별빚이 너무 무거우면 혼자 들고 있을 필요가 없어요. 한국에는 정부·법원이 운영하는
          공식 제도가 있고, 상담은 거의 무료예요. 본인 상황에 맞는 길을 찾는 데
          도움이 되는 정보를 모았어요.
        </p>
      </header>

      <Section
        title="1. 신용회복위원회 — 채무조정 (워크아웃)"
        tone="warmgold"
      >
        <p>
          연체 30일 이상이거나 연체 직전인 분이 가장 먼저 두드릴 곳입니다. 은행·카드·
          저축은행 등 협약 금융사 빚을 모아 <strong>이자 감면 + 분할상환</strong>으로
          재조정해줍니다.
        </p>
        <Bullets>
          <li>대상: 총 채무 15억 원 이하, 연체 30일 이상 (사전채무조정은 30일 미만)</li>
          <li>비용: 신청 5만 원 (분납 가능)</li>
          <li>효과: 이자 감면, 원금 일부 감면 가능, 최장 10년 분할상환</li>
          <li>창구: 1600-5500 / 전국 50개 지부 / cccs.or.kr</li>
        </Bullets>
        <Note>
          신용점수에는 영향이 가지만, 연체가 더 길어지는 것보다 회복이 빠릅니다.
        </Note>
      </Section>

      <Section title="2. 사전채무조정 (프리워크아웃)" tone="sage">
        <p>
          연체 31일 이내 또는 연체 우려 단계에서 신청. 이자율을 낮추고 상환 일정을
          늘려, 연체로 빠지기 전에 숨통을 틔우는 제도입니다.
        </p>
        <Bullets>
          <li>대상: 단기 연체(30일 이하) 또는 다중채무·실직 등 위기 상황</li>
          <li>효과: 이자율 인하, 상환기간 연장 (원금 감면은 일반적으로 없음)</li>
          <li>장점: 연체 기록이 비교적 가볍게 남음</li>
        </Bullets>
      </Section>

      <Section title="3. 개인회생 — 법원 절차" tone="honey">
        <p>
          소득이 있지만 빚이 너무 커서 정상 상환이 불가능한 경우. 법원 인가를 받아
          <strong> 3년(예외적으로 5년)간 일정액만 갚으면 나머지 채무는 면제</strong>
          됩니다.
        </p>
        <Bullets>
          <li>대상: 정기 소득 있는 개인, 무담보채무 10억 원·담보채무 15억 원 이하</li>
          <li>변제기간: 원칙 3년 (특별한 사정 시 최대 5년)</li>
          <li>비용: 인지·송달료·예납금 약 50~80만 원, 변호사 선임 시 추가</li>
          <li>창구: 거주지 관할 회생법원 / 대한법률구조공단 132번 무료 상담</li>
        </Bullets>
        <Note>
          신용회복위원회 워크아웃과 달리 사채·개인 채무도 포함됩니다.
        </Note>
      </Section>

      <Section title="4. 개인파산·면책" tone="clay">
        <p>
          소득이 거의 없고 자산도 변제재원이 못 되는 경우의 마지막 출구.
          파산 선고 + 면책 결정이 나면 채무가 법적으로 없어집니다.
        </p>
        <Bullets>
          <li>대상: 변제 능력이 없는 지급불능 상태의 개인</li>
          <li>제약: 일정 기간 신용거래 제한, 일부 자격 제한 (단, 면책 후 회복)</li>
          <li>비용: 50~100만 원대 + 변호사비 (구조공단 이용 시 무료~저렴)</li>
        </Bullets>
        <Note>
          "파산 = 인생 끝"이 아닙니다. 면책 후 다시 신용을 쌓을 수 있도록 설계된
          공식 제도입니다.
        </Note>
      </Section>

      <Section title="5. 자영업자·소상공인 채무조정" tone="warmgold">
        <p>
          코로나 이후 새출발기금, 새희망홀씨 등 소상공인 전용 창구가 늘었습니다.
        </p>
        <Bullets>
          <li>새출발기금: 소상공인 부실(우려) 채무, 원금 감면 + 장기분할</li>
          <li>서민금융진흥원: 햇살론·미소금융 등 저금리 대환·생계자금</li>
          <li>창구: 1397 (서민금융 통합콜센터)</li>
        </Bullets>
      </Section>

      <Section title="6. 사채·불법추심 대응" tone="sage">
        <p>
          연 20%(법정 최고이자율) 초과 이자, 폭언·협박·가족 연락은 <strong>불법</strong>
          입니다. 갚지 않아도 되는 이자·원금이 있을 수 있으니 반드시 상담받으세요.
        </p>
        <Bullets>
          <li>금감원 1332 (불법사금융 신고)</li>
          <li>채무자대리인 제도: 추심 연락을 변호사가 대신 받음 (서민금융진흥원 통해 무료 가능)</li>
          <li>법정최고이자율 초과분은 무효 — 이미 낸 이자도 반환 청구 가능</li>
        </Bullets>
      </Section>

      <Section title="무료 상담 한 줄 정리" tone="honey">
        <ul className="space-y-2 text-sm">
          <li><strong>1600-5500</strong> — 신용회복위원회 (채무조정·워크아웃)</li>
          <li><strong>1397</strong> — 서민금융진흥원 (저금리 대환·생계자금)</li>
          <li><strong>132</strong> — 대한법률구조공단 (개인회생·파산 무료 법률상담)</li>
          <li><strong>1332</strong> — 금융감독원 (불법사금융·금융분쟁)</li>
          <li><strong>129</strong> — 보건복지콜센터 (긴급생계지원·복지)</li>
        </ul>
      </Section>

      <section className="rounded-2xl border border-line/60 bg-paper-card/30 p-4 text-xs leading-relaxed text-ink-soft">
        <p>
          ⚠ 이 페이지는 일반적인 정보 안내이며 법률·재무 자문이 아닙니다. 본인
          상황에 맞는 결정은 위 공식 창구의 상담사·변호사와 상의해주세요. 제도와
          한도는 정책 변경에 따라 바뀔 수 있습니다.
        </p>
      </section>

      <div className="rounded-2xl border border-warmgold/40 bg-warmgold/10 p-4 text-sm text-ink">
        <p className="font-medium">먼저 한 통의 전화부터.</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          상담은 무료고, 신청 의무도 없어요. 내 상황을 한 번이라도 말로 꺼내면
          별빚의 무게가 달라집니다.
        </p>
      </div>
    </article>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'warmgold' | 'sage' | 'honey' | 'clay';
  children: React.ReactNode;
}) {
  const border =
    tone === 'warmgold'
      ? 'border-warmgold/40'
      : tone === 'sage'
        ? 'border-sage/40'
        : tone === 'honey'
          ? 'border-honey/40'
          : 'border-clay/40';
  const bg =
    tone === 'warmgold'
      ? 'bg-warmgold/5'
      : tone === 'sage'
        ? 'bg-sage/5'
        : tone === 'honey'
          ? 'bg-honey/5'
          : 'bg-clay/5';
  return (
    <section className={`rounded-2xl border ${border} ${bg} p-4`}>
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink/90">
        {children}
      </div>
    </section>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-xs leading-relaxed text-ink-soft marker:text-ink-soft/60">
      {children}
    </ul>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-line/50 bg-paper-card/40 px-3 py-2 text-xs italic text-ink-soft">
      {children}
    </p>
  );
}
