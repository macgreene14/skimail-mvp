import "./globals.css";
import { NavBar } from "./components/NavBar.jsx";
import { Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HotJar from "../../utils/HotJar";
import GA from "../../utils/GA";

const font = Montserrat({ weight: "300", subsets: ["latin"] });

export const metadata = {
  title: "Skimail — The Powder Processor",
  description:
    "Explore Epic and Ikon ski resorts on an interactive map. Compare snowfall, vertical drop, and skiable acres at a glance.",
  metadataBase: new URL("https://macgreene14.github.io/skimail-mvp"),
  openGraph: {
    title: "Skimail — The Powder Processor",
    description:
      "Explore Epic and Ikon ski resorts on an interactive map. Compare snowfall, vertical drop, and skiable acres.",
    url: "https://macgreene14.github.io/skimail-mvp",
    siteName: "Skimail",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skimail — The Powder Processor",
    description:
      "Explore Epic and Ikon ski resorts on an interactive map.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
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
