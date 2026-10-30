import { Suspense } from "react";
import type { Metadata } from "next";

import { LocaleProvider } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

import "./globals.css";

export const metadata: Metadata = {
  title: "问衡 Wenheng",
  description: "用易经、紫微斗数、八字和姓名，把一个决定摊开来看。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <LocaleProvider>
          <Suspense fallback={<div className="h-14 border-b border-border/80" />}>
            <SiteHeader />
          </Suspense>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
