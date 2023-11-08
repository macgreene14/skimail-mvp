import "./globals.css";
import { NavBar } from "./components/NavBar.jsx";
import { Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HotJar from "../../utils/HotJar";
import GA from "../../utils/GA";

const font = Montserrat({ weight: "300", subsets: ["latin"] });

export const metadata = {
  title: "Skimail",
  description: "The Powder Processor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <NavBar />
        {children}
      </body>
      <Analytics />
      <GA />
      <HotJar />
    </html>
  );
}
