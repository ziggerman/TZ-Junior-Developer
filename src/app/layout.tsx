import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Support Hub — Розумна обробка звернень",
  description: "Внутрішня система служби підтримки з автоматичним AI-аналізом звернень, визначенням пріоритету, категорій та генерацією чернеток відповідей.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full bg-[#fbfbfd]">
      <body className="min-h-full flex flex-col text-[#1d1d1f] antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
