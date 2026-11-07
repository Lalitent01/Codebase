import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Script from "next/script";
import AuthModal from "@/components/AuthModal";
import GuestWelcomeBanner from "@/components/GuestWelcomeBanner";

const geistSans = Geist({
  variable: "--font-font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#050d10", // Matches the deep teal-black backdrop of the logo
  width: "device-width",
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://suroor.cc";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Suroor AI | Indian AI Chat in Hinglish & Hindi — Desi Roleplay",
    template: "%s | Suroor AI",
  },
  description:
    "India's premier AI roleplay companion. Chat freely in natural Hinglish, Hindi, and English with authentic Indian AI characters, girlfriends, boyfriends, and immersive fictional storylines.",
  keywords: [
    "Suroor",
    "Suroor AI",
    "Indian AI Chat",
    "Hinglish AI Chat",
    "Hindi AI Chat",
    "AI Girlfriend India",
    "AI Boyfriend India",
    "Desi AI Roleplay",
    "Hinglish Chatbot",
    "Indian AI Characters",
    "Free Indian AI Chat",
    "AI Companion India",
    "Uncensored Roleplay India",
    "Romantic AI Chat India",
  ],
  authors: [{ name: "Suroor AI" }],
  creator: "Suroor AI",
  publisher: "Suroor AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // ─── SEARCH RESULT & BROWSER ICONS ───────────────────────────────────────
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  // ─── SOCIAL OPEN GRAPH (Discord, WhatsApp, Telegram, Facebook) ────────────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Suroor AI",
    title: "Suroor AI | Indian AI Chat in Hinglish & Hindi — Desi Roleplay",
    description:
      "Chat freely with authentic Indian AI companions in Hinglish and Hindi. Unfiltered romance, deep storylines, and zero judgment.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Suroor AI — Indian AI Chat & Roleplay",
      },
    ],
  },
  // ─── TWITTER / X CARDS ───────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Suroor AI | Indian AI Chat in Hinglish & Hindi",
    description:
      "Immersive Indian AI companions. Chat in natural Hinglish, Hindi, and English with deep memory and true personality.",
    images: ["/og-image.png"],
  },
  // ─── SEARCH CRAWL DIRECTIVES ─────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Google Structured Data (JSON-LD) for Rich Sitelinks & Search Branding
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Suroor AI",
    alternateName: ["Suroor", "Suroor Roleplay", "Suroor Indian AI"],
    url: siteUrl,
    description:
      "India's premier AI companion roleplay platform in Hinglish, Hindi, and English.",
    inLanguage: ["en-IN", "hi-IN"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Schema.org WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#030708] text-white min-h-screen flex flex-col selection:bg-[#7be4d5]/20 selection:text-[#7be4d5]`}
      >
        <AuthProvider>
          {/* Global Auth Modal */}
          <AuthModal />

          {/* Floating Guest Welcome Banner for New Visitors */}
          <GuestWelcomeBanner />

          {/* Main content wrapper */}
          <div className="flex-1 flex flex-col min-h-screen">{children}</div>

          {/* Global Footer */}
          <Footer />
        </AuthProvider>

        {/* Razorpay Standard Checkout SDK */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}