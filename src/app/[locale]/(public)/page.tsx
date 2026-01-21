import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getApiBaseUrl, getSiteUrl } from "@/lib/env";
import Image from "next/image";
import Spotlight from "@/components/spotlight/Spotlight";
import Showreel from "@/components/showreel/Showreel";
import ClientReviews from "@/components/client-reviews/ClientReviews";
import { ReservationForm } from "@/components/shared/reservation-form";
import FadeIn from "@/components/animate/FadeIn";
import NewMenu from "@/components/shared/NewMenu";

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

type ApiTestimonial = {
  quote_i18n?: Partial<Record<Locale, string>>;
  quote?: string | null;
  authorName?: string | null;
  authorRole_i18n?: Partial<Record<Locale, string>>;
  authorRole?: string | null;
  rating?: number | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  avatarAssetId?: string | null;
  avatarAsset?: { url?: string | null } | null;
  sourceUrl?: string | null;
  reviewUrl?: string | null;
  link?: string | null;
  source?: string | null;
};

async function fetchTestimonials(locale: Locale) {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/testimonials?limit=6&page=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const payload = await res.json();
    const items = Array.isArray(payload)
      ? payload
      : (payload?.items ?? payload?.data ?? []);
    if (!Array.isArray(items)) return [];
    const avatarAssetsById = new Map<string, string>();
    const assetRes = await fetch(
      `${apiBase}/media-assets?limit=200&page=1`,
      { next: { revalidate: 300 } }
    );
    if (assetRes.ok) {
      const assetPayload = await assetRes.json();
      const assetItems = Array.isArray(assetPayload)
        ? assetPayload
        : (assetPayload?.items ?? assetPayload?.data ?? []);
      if (Array.isArray(assetItems)) {
        assetItems.forEach((asset: { _id?: string; id?: string; url?: string }) => {
          const assetId = asset._id ?? asset.id;
          if (assetId && asset.url) {
            avatarAssetsById.set(String(assetId), asset.url);
          }
        });
      }
    }
    return items
      .map((item: ApiTestimonial) => {
        const review = item.quote_i18n?.[locale] ?? item.quote ?? "";
        const clientName = item.authorName ?? "Guest";
        const clientCompany =
          item.authorRole_i18n?.[locale] ??
          item.authorRole ??
          item.source ??
          "";
        const avatar =
          item.avatar ??
          item.avatarUrl ??
          item.avatarAsset?.url ??
          (item.avatarAssetId
            ? avatarAssetsById.get(item.avatarAssetId) ?? undefined
            : undefined);
        const reviewUrl =
          item.reviewUrl ??
          item.sourceUrl ??
          item.link ??
          (item.source && item.source.startsWith("http")
            ? item.source
            : undefined);
        return {
          review,
          clientName,
          clientCompany,
          rating: typeof item.rating === "number" ? item.rating : undefined,
          avatar,
          reviewUrl,
        };
      })
      .filter((item) => item.review && item.clientName);
  } catch (error) {
    console.error("Failed to load testimonials", error);
    return [];
  }
}

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
  const aboutBody = (t.raw("aboutBody") as string[]) ?? [];
  const testimonialItems = await fetchTestimonials(locale);

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
      <section id="story" className="relative overflow-hidden bg-[#0e0f0c]">
        <div className="absolute inset-0">
          <Image
            src="/intro/in1.jpg"
            alt={t("aboutImageAlt")}
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
        </div>

        <div className="relative mx-auto grid min-h-[80vh] max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="absolute -left-10 top-1/2 hidden -translate-y-1/2 lg:block">
            <p className="text-[120px] font-bold uppercase leading-[0.8] tracking-[0.2em] text-white/10">
              Achi
            </p>
          </div>

          <div className="relative z-10">
            <FadeIn direction="up" amount={0.2}>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                About Us
              </p>
            </FadeIn>
            <FadeIn direction="up" amount={0.2} delay={0.1}>
              <h2 className="mt-4 font-[var(--font-playfair)] text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                {t("aboutTitle")}
              </h2>
            </FadeIn>
            <FadeIn direction="up" amount={0.2} delay={0.2}>
              <div className="mt-6 space-y-4 text-base leading-7 text-white/80 sm:text-lg">
                {aboutBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn direction="left" amount={0.2}>
            <div className="relative rounded-[36px] border border-white/15 bg-white/5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="relative overflow-hidden rounded-[28px]">
                <Image
                  src="/intro/in1.jpg"
                  alt={t("aboutImageAlt")}
                  width={720}
                  height={900}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.25em] text-white/60">
                <div className="rounded-full border border-white/10 px-3 py-2">
                  Organic
                </div>
                <div className="rounded-full border border-white/10 px-3 py-2">
                  Hanoi
                </div>
                <div className="rounded-full border border-white/10 px-3 py-2">
                  Vegan
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
      <NewMenu />
      <section>
        <ClientReviews items={testimonialItems} />
      </section>
      <section>
        <Spotlight />
      </section>
      <section id="reservation" className="bg-[#ede6d8] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <ReservationForm />
        </div>
      </section>
    </main>
  );
}
