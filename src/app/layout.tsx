import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata = {
  title: "isaacchacko.com",
  description: "Isaac Chacko — personal site.",
};

export const viewport = {
  themeColor: "#a3c585",
};

// the site itself is the Basalt garden in public/ (scripts/build-site.mjs);
// what Next still renders is /play, which has its own layout, and the 404
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
