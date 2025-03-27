import { Manrope } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import './globals.css';

const manrope = Manrope({
  weight: '400',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={manrope.className}>
      <Analytics/>
      <body>
        {/* Shared base for all layouts */}
        {children}
      </body>
    </html>
  );
}
