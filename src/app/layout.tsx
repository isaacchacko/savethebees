import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import { bricolage, dmSerifDisplay } from "@public/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSerifDisplay.variable}`}>
      <Analytics />
      <body>
        {children}
      </body>
    </html>
  );
}
