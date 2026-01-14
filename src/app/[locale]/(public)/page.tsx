import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import Spotlight from "@/components/spotlight/Spotlight";
import Showreel from "@/components/showreel/Showreel";
import ClientReviews from "@/components/client-reviews/ClientReviews";

export const revalidate = 300;

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = "https://www.achiveganhouse.com.vn/Logo/Home1.jpg";

const HOME_META = {
  vi: {
    title:
      "Achi Vegan House - Nhà Chay Achi cung cấp gần 100 món ăn chay được chế biến từ rau, củ, quả, hạt.. sạch hữu cơ.",
    description:
      "Achi Vegan House tại 50 đường Thụy Khuê, Hà Nội nổi tiếng với các món chay thuần chay ngon. Ghé quán, thưởng thức món ăn hoặc đặt mang đi đúng giờ bạn cần.",
  },
  en: {
    title:
      "Achi Vegan House – Vegan restaurant in Hanoi with nearly 100 organic vegan dishes.",
    description:
      "Achi Vegan House at 50 Thuy Khue Street, Hanoi, known for delicious vegan dishes. Visit, enjoy a meal, or order takeout on time.",
  },
} as const;

function getLocalePrefix(locale: Locale) {
  return locale === "en" ? "/en" : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = HOME_META[locale === "en" ? "en" : "vi"];
  const prefix = getLocalePrefix(locale);
  const canonical = prefix ? `${BASE_URL}${prefix}` : `${BASE_URL}/`;

  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/`,
        en: `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home");

  const baseUrl = BASE_URL;
  const localePrefix = locale === "en" ? "/en" : "";
  const pageUrl = localePrefix ? `${baseUrl}${localePrefix}` : `${baseUrl}/`;

  const alternateNames = [
    "Achi Vegan House",
    "Achi Vegan House Hanoi",
    "Achi Vegan House Vegan Restaurant",
    "Achi Vegan House Vegan Food",
  ];

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AchiVeganHouse",
        "@id": `${pageUrl}#cafe`,
        name: "Achi Vegan House",
        alternateName: alternateNames,
        url: pageUrl,
        image: `${baseUrl}/Logo/Logo1.jpg`,
        address: {
          addressLocality: "Hanoi",
          addressCountry: "VN",
        },
        servesCuisine: ["Vegan", "Vegetarian"],
        sameAs: [
          "https://www.facebook.com/nhachayachi",
          "https://www.instagram.com/achiveganhouse",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        name: "Achi Vegan House",
        alternateName: alternateNames,
        url: pageUrl,
        inLanguage: locale === "en" ? "en" : "vi-VN",
      },
    ],
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <section>
        <Showreel />
      </section>
      <section>
        <ClientReviews />
      </section>
      <section>
        <Spotlight />
      </section>
    </main>
  );
}
