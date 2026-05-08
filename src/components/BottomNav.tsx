'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '홈', icon: HomeIcon },
  { href: '/debts', label: '별빚', icon: SealIcon },
  { href: '/plan', label: '플랜', icon: PlanIcon },
  { href: '/insights', label: '오늘', icon: InsightIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-3 pb-3">
      <div className="flex items-center justify-around rounded-2xl border border-line/60 bg-paper/80 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
        {TABS.map((t) => {
          const active = isActive(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? 'text-warmgold' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon active={active} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function SealIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,3 14.5,9 21,9.5 16,14 17.5,20.5 12,17 6.5,20.5 8,14 3,9.5 9.5,9" />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 9 11l4 4 8-9" />
      <path d="M14 6h7v7" />
    </svg>
  );
}

function InsightIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0-4 10.5V16a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.5A6 6 0 0 0 12 3z" />
      <path d="M9 21h6" />
    </svg>
  );
}
