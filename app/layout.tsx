import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { getBaseUrl } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = localFont({
  src: "./fonts/BebasNeue-Regular.ttf",
  variable: "--font-bebas-neue",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Grid to Green | AI-Powered F1 Race Briefings",
    template: "%s | Grid to Green",
  },
  description:
    "AI-generated Formula 1 race previews synthesizing prediction markets, qualifying telemetry, historical data, and weather forecasts.",
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: "Grid to Green",
    description: "The smartest F1 race preview on the internet.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const websiteJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Grid to Green",
  url: getBaseUrl(),
  description:
    "AI-generated Formula 1 race previews synthesizing prediction markets, qualifying telemetry, historical data, and weather forecasts.",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
        />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
