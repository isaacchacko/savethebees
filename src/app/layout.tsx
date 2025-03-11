import { Manrope } from 'next/font/google';
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
      <body>
        {/* Shared base for all layouts */}
        {children}
      </body>
    </html>
  );
}
