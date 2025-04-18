import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import RecoilContextProvider from "@/components/provider/recoil_context_provider";
import Navbar from "@/components/navbar";
import { DM_Sans } from "next/font/google";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
// });

const dmSans = DM_Sans({
  subsets: ["latin"], // Load only the Latin characters
  weight: ["400", "500", "700"], // Load specific font weights
  variable: "--font-dm-sans", // Assign a CSS variable
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <RecoilContextProvider>
        <body className={`${dmSans.variable}`}>
          <Navbar />
          {children}
          <Toaster />
        </body>
      </RecoilContextProvider>
    </html>
  );
}
