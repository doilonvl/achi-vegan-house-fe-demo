import Providers from "@/provider";
import "./globals.css";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Caladea } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
// import TawkTo from "@/components/TawkTo";

const caladea = Caladea({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caladea",
});

const BASE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: "Achi Vegan House", template: "%s | Achi Vegan House" },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    siteName: "Achi Vegan House",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning className={caladea.variable}>
      <body>
        <Providers>{children}</Providers>
        {/* <TawkTo /> */}
      </body>
    </html>
  );
}
