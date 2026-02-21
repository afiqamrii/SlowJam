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
  // MAINTENANCE MODE FLAG
  const isMaintenanceMode = true;

  if (isMaintenanceMode) {
    return (
      <html lang="en">
        <body className={`${gloria.variable} font-sans antialiased bg-black text-white flex flex-col items-center justify-center min-h-screen text-center px-6`}>
          <div className="space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-full bg-neutral-800 flex items-center justify-center mb-8">
              <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Be right back.</h1>
            <p className="text-neutral-400 text-lg">
              SlowJam is currently undergoing scheduled maintenance to improve our Spotify integrations.
            </p>
            <p className="text-sm text-neutral-600 pt-4">
              We should be back online shortly. Thanks for your patience!
            </p>
          </div>
        </body>
      </html>
    );
  }

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
