import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./request";

export const pathnames = {
  "/": "/",
  "/admin": {
    vi: "/admin",
    en: "/admin",
  },
  "/privacy-policy": {
    vi: "/chinhsach-baomat",
    en: "/privacy-policy",
  },
  "/menu": {
    vi: "/thuc-don",
    en: "/menu",
  },
} as const;

export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
    pathnames,
    localePrefix: "as-needed",
  });
