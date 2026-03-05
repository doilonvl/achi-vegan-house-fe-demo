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
  weight: ["400", "600", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const BASE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: "Achi Vegan House - Nhà hàng chay Hà Nội", template: "%s | Achi Vegan House" },
  description:
    "Nhà hàng chay Achi Vegan House - Quán ăn chay, thuần chay, vegan hữu cơ tại Hà Nội. Gần 100 món chay ngon từ nguyên liệu sạch.",
  keywords: [
    "nhà hàng chay",
    "quán ăn chay",
    "thuần chay",
    "vegan",
    "chay Hà Nội",
    "vegan Hanoi",
    "plant-based",
    "organic",
    "hữu cơ",
    "ăn chay",
    "đồ ăn chay",
    "vegetarian",
    "quán chay ngon",
  ],
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
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Script id="gtag-delayed" strategy="lazyOnload">
          {`
            (function(){
              var loaded=false;
              function loadGTM(){
                if(loaded)return;
                loaded=true;
                window.dataLayer=window.dataLayer||[];
                function gtag(){dataLayer.push(arguments);}
                window.gtag=gtag;
                gtag('js',new Date());
                gtag('config','G-WDD481BL2J',{send_page_view:false});
                gtag('config','AW-17971414705',{send_page_view:false});
                var s=document.createElement('script');
                s.src='https://www.googletagmanager.com/gtag/js?id=G-WDD481BL2J&l=dataLayer';
                s.async=true;
                document.head.appendChild(s);
                gtag('event','page_view');
              }
              var t=setTimeout(loadGTM,5000);
              ['scroll','click','touchstart','keydown'].forEach(function(e){
                document.addEventListener(e,function(){clearTimeout(t);loadGTM()},{once:true,passive:true});
              });
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
