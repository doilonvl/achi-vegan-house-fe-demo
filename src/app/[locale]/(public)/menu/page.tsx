import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import MenuShowcase from "@/components/menu/MenuShowcase";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Menu/m-0.jpg`;

const MENU_IMAGES = [
  "/Menu/m-0.jpg",
  "/Menu/m-1.jpg",
  "/Menu/m-2.jpg",
  "/Menu/m-3.jpg",
  "/Menu/m-4.jpg",
  "/Menu/m-5.jpg",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  const canonical =
    locale === "en" ? `${BASE_URL}/en/menu` : `${BASE_URL}/thuc-don`;

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/thuc-don`,
        en: `${BASE_URL}/en/menu`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function MenuPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "menu" });
  const localePrefix = getLocalePrefix(locale);
  const pages = (t.raw("pages") as string[]) ?? [];
  const pageLabel = t("pageLabel");

  const menuPages = MENU_IMAGES.map((src, index) => ({
    src,
    label: pages[index] ?? `${pageLabel} ${String(index + 1).padStart(2, "0")}`,
  }));

  return (
    <main>
      <MenuShowcase
        eyebrow={t("eyebrow")}
        title={t("title")}
        tagline={t("tagline")}
        highlights={(t.raw("highlights") as string[]) ?? []}
        ctaPrimary={t("ctaPrimary")}
        ctaSecondary={t("ctaSecondary")}
        ctaNote={t("ctaNote")}
        primaryHref={`${localePrefix}/#contact`}
        secondaryHref={`${localePrefix}/#contact`}
        sectionTitle={t("sectionTitle")}
        sectionSubtitle={t("sectionSubtitle")}
        indexTitle={t("indexTitle")}
        pages={menuPages}
      />
    </main>
  );
}
