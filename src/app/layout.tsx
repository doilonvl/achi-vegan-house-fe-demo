import Providers from "@/provider";
import "./globals.css";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Playfair_Display } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
import Script from "next/script";
// import TawkTo from "@/components/TawkTo";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-playfair",
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
    <html lang={locale} suppressHydrationWarning className={playfair.variable}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WDD481BL2J"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WDD481BL2J');
            gtag('config', 'AW-17971414705');
          `}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
        {/* <TawkTo /> */}
      </body>
    </html>
  );
}
