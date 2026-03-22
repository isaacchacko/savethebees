import { Mansalva } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import { gr, bricolage } from "@public/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${gr.className} ${bricolage.variable}`}>
      <Analytics />
      <body>
        {children}
      </body>
    </html>
  );
}
