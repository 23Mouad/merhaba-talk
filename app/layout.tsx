import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/app/components/ui/Sidebar";
import { ThemeProvider } from "@/app/components/ui/ThemeProvider";
import { PageTransition } from "@/app/components/ui/PageTransition";

export const metadata: Metadata = {
  title: "TürkçeAI — تعلم التركية بالذكاء الاصطناعي",
  description: "تطبيق تعلم اللغة التركية بالذكاء الاصطناعي — مستوى B1 وB2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A73E8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Tajawal:wght@300;400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main id="main-content" style={{ flex: 1, transition: "margin-right 0.3s" }}>
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
