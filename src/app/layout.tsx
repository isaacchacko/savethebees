import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono } from "next/font/google";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <head>
        {/* has to run before the first frame, where a page learns how it was arrived at */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/page-morph.js" />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
