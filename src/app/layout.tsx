import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import '@/lib/env'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'),
  title: {
    default: "LunaCradle - Personalized AI Sleep Plans for Your Baby",
    template: "%s | LunaCradle",
  },
  description: "Gentle, evidence-based sleep plans for your baby, powered by AI. Better sleep for baby, better rest for you.",
  openGraph: {
    type: 'website',
    siteName: 'LunaCradle',
    title: 'LunaCradle - Personalized AI Sleep Plans for Your Baby',
    description: 'Gentle, evidence-based sleep plans for your baby, powered by AI. Better sleep for baby, better rest for you.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
