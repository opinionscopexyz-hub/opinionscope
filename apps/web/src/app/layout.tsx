import type { Metadata } from "next";
import Script from "next/script";

import { ClerkProvider } from "@clerk/nextjs";

import "../index.css";
import { Fira_Code, Fira_Sans } from "next/font/google";

import Header from "@/components/header";
import Providers from "@/components/providers";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://opinionscope.xyz"),
  title: "OpinionScope - Prediction Market Intelligence",
  description:
    "Track whale trades in real-time, screen thousands of markets, and get alerts before prices move. Professional-grade tools for prediction market traders.",
  keywords: [
    "prediction markets",
    "polymarket",
    "whale tracking",
    "crypto trading",
    "market screener",
  ],
  openGraph: {
    title: "OpinionScope - Whales Tracking for Prediction Markets",
    description:
      "Track whale trades in real-time, screen thousands of markets, and get alerts before prices move.",
    url: "https://opinionscope.xyz",
    siteName: "OpinionScope",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "OpinionScope Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "OpinionScope - Prediction Market Intelligence",
    description:
      "Track whale trades in real-time, screen thousands of markets, and get alerts before prices move.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          defer
          src="https://umami.opinionscope.xyz/script.js"
          data-website-id="b4215715-3a1b-4774-8e72-acda3fffe3f8"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${firaSans.variable} ${firaCode.variable} antialiased dark`} style={{ fontFamily: 'var(--font-fira-sans)' }}>
        <ClerkProvider>
          <Providers>
            <div className="grid grid-rows-[auto_1fr] h-svh">
              <Header />
              {children}
            </div>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
