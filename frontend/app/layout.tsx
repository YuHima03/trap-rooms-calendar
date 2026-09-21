import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/features/auth/auth-provider";
import { materialSymbolsStylesheetUrl } from "@/lib/material-symbols";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "進捗部屋情報",
    template: "%s | 進捗部屋情報",
  },
  description: "traP の進捗部屋と大学の空き教室、カレンダー配信",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={materialSymbolsStylesheetUrl} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <Header />
          <main className="flex flex-col gap-y-6 p-6 mx-auto max-w-5xl">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
