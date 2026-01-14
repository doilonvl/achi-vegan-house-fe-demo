/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getLocalePrefix } from "@/lib/routes";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

type NavItem = {
  label: string;
  target?: string;
  href?: string;
};

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const mobileMenuId = "mobile-menu-sheet";
  const locale = useLocale();
  const t = useTranslations("header");
  const pathname = usePathname();
  const router = useRouter();
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const homeHref = localePrefix || "/";

  const navItems: NavItem[] = useMemo(
    () => [
      { label: t("products"), href: "/menu" },
      { label: t("about"), target: "story" },
      { label: t("contact"), target: "contact" },
      // { label: t("blog"), href: "/blog" },
    ],
    [t]
  );

  const isHome = useMemo(() => {
    const base = localePrefix || "/";
    if (base === "/") return pathname === "/";
    return pathname === base || pathname === `${base}/`;
  }, [localePrefix, pathname]);

  const scrollToTarget = useCallback((targetId: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollToFooter = useCallback(() => {
    if (typeof window === "undefined") return false;
    const footer = document.getElementById("contact");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const last = lastScrollY.current;

      if (current <= 0 || current < last) {
        setIsVisible(true);
      } else if (current > last) {
        setIsVisible(false);
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.href) {
        router.push(item.href as any);
        setIsMenuOpen(false);
        return;
      }

      if (!item.target) return;

      if (item.target === "contact") {
        const didScroll = scrollToFooter();
        if (didScroll) {
          setIsMenuOpen(false);
          return;
        }
        window.location.href = `${homeHref}#contact`;
        setIsMenuOpen(false);
        return;
      }

      if (isHome) {
        scrollToTarget(item.target);
        setIsMenuOpen(false);
      } else if (typeof window !== "undefined") {
        window.location.href = `${homeHref}#${item.target}`;
        setIsMenuOpen(false);
      }
    },
    [homeHref, isHome, router, scrollToFooter, scrollToTarget]
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-white">
        <Link href={homeHref} className="pointer-events-auto">
          <Image
            src="/Logo/Logo1.jpg"
            alt={t("brandName")}
            width={220}
            height={78}
            className="h-12 w-auto rounded-full border border-white/30 object-cover shadow"
            priority
          />
        </Link>

        <div className="pointer-events-auto flex items-center gap-3">
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger
              asChild
              className="md:hidden"
              aria-controls={mobileMenuId}
            >
              <button
                type="button"
                aria-label={t("openMenu")}
                aria-expanded={isMenuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white transition hover:bg-white/15"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              id={mobileMenuId}
              side="right"
              className="w-[62vw] max-w-[13rem] border-none bg-gradient-to-b from-neutral-950/95 via-neutral-900/90 to-black/85 text-white backdrop-blur-md"
            >
              <SheetHeader className="mb-4 pb-2 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/85">
                  {t("brandName")}
                </p>
                <SheetTitle className="mt-1 text-xl font-semibold text-white">
                  {t("menuTitle")}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {t("menuDescription")}
                </SheetDescription>
              </SheetHeader>

              <nav className="space-y-2">
                <ul className="flex flex-col gap-1 text-base font-semibold">
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left font-semibold text-white/90 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
                        onClick={() => handleNavClick(item)}
                      >
                        <span className="tracking-tight">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          <nav className="hidden md:block">
            <ul className="flex flex-wrap items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-sm font-semibold backdrop-blur">
              {navItems.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className="cursor-pointer rounded-full px-3 py-1 transition hover:bg-white/15"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile drawer is handled by Sheet above */}
    </div>
  );
}
