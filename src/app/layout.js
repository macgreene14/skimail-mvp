import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HotJar from "../../utils/HotJar";
import GA from "../../utils/GA";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Skimail",
  description: "The Powder Processor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <GA />
      </head>
      <body className={inter.className}>{children}</body>
      <Analytics />
      <HotJar />
    </html>
  );
}
