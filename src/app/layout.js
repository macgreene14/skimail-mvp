import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HotJar from "../../utils/HotJar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Skimail",
  description: "The Powder Processor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <Analytics />
      <HotJar />
    </html>
  );
}
