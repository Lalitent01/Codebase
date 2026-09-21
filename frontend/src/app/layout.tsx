import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Script from "next/script";
import AuthModal from "@/components/AuthModal";
import GuestWelcomeBanner from "@/components/GuestWelcomeBanner"; // 1. Import the banner

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Suroor | Immersive AI Roleplay",
    template: "%s | Suroor",
  },
  description: "The premier destination for private, high-fidelity AI companion roleplay in India.",
  keywords: ["Suroor", "Hinglish AI", "Virtual Companion", "AI Chat India"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col`}
      >
        <AuthProvider>
          {/* Global Auth Modal */}
          <AuthModal />

          {/* 2. Floating Guest Welcome Banner for New Visitors */}
          <GuestWelcomeBanner />

          {/* Main content wrapper */}
          <div className="flex-1 flex flex-col min-h-screen">
            {children}
          </div>
          
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