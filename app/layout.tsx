import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/ui/Navbar";
import Image from "next/image";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#030406",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "ICAT Vote",
  description: "Official Campus Voting Arena",
  manifest: "/manifest.json",
  icons: {
    icon: "/icat-emblem.png",
    shortcut: "/icat-emblem.png",
    apple: "/icat-emblem.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} dark`}>
      <body className="text-[#F8FAFC] antialiased selection:bg-[#38BDF8] selection:text-[#030406]">
        <div className="scanlines" />
        <AuthProvider>
          <div className="flex flex-col h-[100dvh] w-screen overflow-hidden relative">
            <Navbar />
            <main className="flex-1 flex flex-col w-full relative z-10 overflow-hidden">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
