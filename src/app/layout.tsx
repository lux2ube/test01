import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Cairo, Tajawal } from 'next/font/google';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/site-config';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-headline',
});

const fontArabic = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.description,
  keywords: [...siteConfig.seo.keywords],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cn("font-arabic antialiased", fontBody.variable, fontHeadline.variable, fontArabic.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
