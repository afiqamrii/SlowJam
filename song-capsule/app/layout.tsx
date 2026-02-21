import type { Metadata } from "next";
import { Gloria_Hallelujah } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const gloria = Gloria_Hallelujah({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gloria",
});

export const metadata: Metadata = {
  title: "SlowJam - Send a song to the future",
  description: "Send a song to the future.",
  icons: {
    icon: "/logo.png",
  },
  verification: {
    google: "hEivKR2aEDDOBlY8Ca6MWOiDqTFyJ5atGRyKqmSG2yk",
  },
};

import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5323094111362358"
          crossOrigin="anonymous"></script>
      </head>
      <body className={`${gloria.variable} font-sans antialiased text-[var(--foreground)] bg-[var(--background)]`}>
        <Navbar />
        <main className="flex-1 pt-14">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
