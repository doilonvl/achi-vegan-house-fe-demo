import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/request";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export function generateStaticParams() {
  return [{ locale: "vi" }, { locale: "en" }];
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const resolvedLocale = locale as Locale;
  setRequestLocale(resolvedLocale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <Header />
      {children}
      <Footer />
      <Toaster />
    </NextIntlClientProvider>
  );
}
