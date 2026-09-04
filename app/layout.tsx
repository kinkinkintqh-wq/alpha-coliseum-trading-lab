import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Alpha Coliseum: Market Rift | 行情裂隙',
  description:
    '一款由真实市场数据改变战场环境的快节奏策略卡牌游戏。',
  openGraph: {
    title: 'Alpha Coliseum: Market Rift',
    description: '真实行情改变战场，策略决定胜负。',
    type: 'website',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'Alpha Coliseum AI Crypto Battle Arena' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Coliseum: Market Rift',
    description: '真实行情改变战场，策略决定胜负。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
