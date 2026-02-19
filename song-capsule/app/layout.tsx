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
  title: "SlowJam",
  description: "Send a song to the future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gloria.variable} antialiased selection:bg-purple-500 selection:text-white min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
