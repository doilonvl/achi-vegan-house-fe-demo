import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import CinematicMenu from "@/components/menu/CinematicMenu";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Menu/m-0.jpg`;

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
  const menuSections = (t.raw("menuSections") as Array<{
    title: string;
    items: Array<{ label: string; image: string }>;
  }>) ?? [];

  return (
    <main>
      <CinematicMenu
        eyebrow={t("eyebrow")}
        title={t("title")}
        tagline={t("tagline")}
        sections={menuSections}
      />
    </main>
  );
}
