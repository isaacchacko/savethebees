import { Manrope } from 'next/font/google';
import "./globals.css";

const manrope = Manrope({
  weight: '400', // Specify weight if not using variable font
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={manrope.className}>
      <body>{children}</body>
    </html>
  );
}
