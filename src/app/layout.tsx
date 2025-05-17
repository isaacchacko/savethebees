import { Mansalva } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import './globals.css';

const mansalva = Mansalva({
  weight: '400',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={mansalva.className}>
      <Analytics/>
      <body>
        {/* Shared base for all layouts */}
        {children}
      </body>
    </html>
  );
}
