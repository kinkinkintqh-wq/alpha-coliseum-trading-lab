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
  title: 'Alpha Coliseum Trading Lab | 交易人格实验场',
  description:
    '用真实历史行情、模拟资金和策略卡牌训练你的交易人格。',
  openGraph: {
    title: 'Alpha Coliseum Trading Lab',
    description: '训练你的策略，塑造你的交易人格。',
    type: 'website',
    images: [{ url: '/game-art/market-rift-keyart-v1.png', width: 1536, height: 1024, alt: 'Alpha Coliseum Trading Lab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Coliseum Trading Lab',
    description: '训练你的策略，塑造你的交易人格。',
    images: ['/game-art/market-rift-keyart-v1.png'],
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
