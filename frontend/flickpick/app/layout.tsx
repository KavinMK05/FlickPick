import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Be_Vietnam_Pro } from "next/font/google";

const BeVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ["100","200","300","400","500","600"]
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased ${BeVietnamPro.className}`}
      >
        {children}
      </body>
    </html>
  );
}
