import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono } from "next/font/google";
import ThemeRotator from "@/components/ThemeRotator";
import { THEMES, THEME_MS } from "@/lib/themes";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Runs before the page paints, so the rotating theme never flashes the
// default one first. Sets an attribute React does not manage, so it cannot
// cause a hydration mismatch.
const THEME_BOOTSTRAP = `(function(){try{var t=${JSON.stringify(
  THEMES
)};document.documentElement.dataset.theme=t[Math.floor(Date.now()/${THEME_MS})%t.length]}catch(e){}})()`;

export const metadata = {
  title: "isaacchacko.com",
  description: "Isaac Chacko — personal site.",
};

export const viewport = {
  themeColor: "#ff5fa8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <ThemeRotator />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
