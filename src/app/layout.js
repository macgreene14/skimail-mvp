import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HotJar from "./components/HotJar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Skimail",
  description: "Experience the Power of the Pow Processor",
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
