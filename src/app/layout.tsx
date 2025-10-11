import { Mansalva } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import { gr } from "@public/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={gr.className}>
      <Analytics />
      <body>
        {/* Shared base for all layouts */}
        {children}
      </body>
    </html>
  );
}
