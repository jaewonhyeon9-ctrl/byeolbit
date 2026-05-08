import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StarryBackground } from '@/components/StarryBackground';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '별빚도장 — 별빛이 되는 순간까지',
  description:
    '빚을 빛으로 바꾸는 시간. 부채 관리 + 매일 마인드셋 + 도장깨기로 자유로 향하는 PWA.',
  applicationName: '별빚도장',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '별빚도장',
  },
};

export const viewport: Viewport = {
  themeColor: '#f5ecd6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        <StarryBackground />
        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <main className="flex-1 px-5 pt-6 pb-28">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
