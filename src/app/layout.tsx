import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono } from "next/font/google";
import Card from "@/components/Card";
import Stage from "@/components/Stage";
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

// the card lives here rather than in each page so it survives navigation —
// that is what lets it resize and slide between tabs instead of reloading
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <Stage>
          <Card>{children}</Card>
        </Stage>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
