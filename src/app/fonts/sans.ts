import localFont from "next/font/local";

export const sans = localFont({
  src: "./zalando-sans-latin.woff2",
  weight: "400 600",
  display: "swap",
  variable: "--font-sans",
});
