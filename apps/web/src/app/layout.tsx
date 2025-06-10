import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@repo/auth';
import { authConfig } from '@/lib/auth-config';
import { AppLayout } from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fun Scrum - Planning Poker',
  description: 'A fun and interactive planning poker tool for agile teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider config={authConfig}>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 