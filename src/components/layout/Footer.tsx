/* eslint-disable @next/next/no-img-element */
"use client";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Mail,
  MapPin,
  Phone,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getLocalePrefix } from "@/lib/routes";

type DayHours = { day: string; start: string; end: string };

const HOURS = { start: "07:30", end: "22:30" };

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const isOpenNow = () => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(HOURS.start);
  const end = toMinutes(HOURS.end);
  return minutes >= start && minutes <= end;
};

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const [isOpen, setIsOpen] = useState(isOpenNow());
  const [showPopup, setShowPopup] = useState(false);

  const weeklyHours: DayHours[] = useMemo(() => {
    const days = (t.raw("weekdays") as string[]) || [];
    return days.map((day) => ({ day, start: HOURS.start, end: HOURS.end }));
  }, [t]);

  const services = useMemo<string[]>(() => {
    const items = t.raw("services") as string[] | undefined;
    return items ?? [];
  }, [t]);

  const features = useMemo<string[]>(() => {
    const items = t.raw("features") as string[] | undefined;
    return items ?? [];
  }, [t]);

  const mapRatingValue = useMemo(() => {
    const raw = t.raw("mapRatingValue") as number | string | undefined;
    const value = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(value) ? value : 0;
  }, [t]);

  const mapReviewCount = useMemo(() => {
    const raw = t.raw("mapReviewCount") as number | string | undefined;
    const value = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(value) ? value : 0;
  }, [t]);

  const fullStars = Math.floor(mapRatingValue);
  const hasHalfStar = mapRatingValue - fullStars >= 0.5;

  useEffect(() => {
    const id = setInterval(() => setIsOpen(isOpenNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const statusLabel = useMemo(
    () => (isOpen ? t("statusOpen") : t("statusClosed")),
    [isOpen, t]
  );

  return (
    <>
      <footer
        id="contact"
        className="mt-16 border-t border-amber-100 text-slate-900"
      >
        <div className="h-1 w-full bg-linear-to-r from-emerald-500 via-teal-400 to-lime-300" />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <img
                  src="/Logo/Logo1.jpg"
                  alt={t("brandName")}
                  className="h-12 w-12 rounded-full border border-amber-200 object-cover shadow-sm"
                />
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {t("brandName")}
                  </p>
                  <p className="text-sm text-slate-600">{t("brandTagline")}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {t("brandDescription")}
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-5 w-5 text-amber-500" />
                  <span>{t("address")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  <a
                    href="tel:+84985310238"
                    className="transition hover:text-amber-600"
                  >
                    098 531 02 38
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-red-600" />
                  <a
                    href="mailto:sunnyhoai.vu@gmail.com"
                    className="transition hover:text-amber-600"
                  >
                    sunnyhoai.vu@gmail.com
                  </a>
                </p>
                {/* <p className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-slate-500" />
                  <a
                    href="https://achi.business.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-amber-600"
                  >
                    achi.business.site
                  </a>
                </p> */}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-white/80 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm text-slate-500">{t("hoursLabel")}</p>
                    <p className="text-base font-semibold text-slate-900">
                      {statusLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPopup(true)}
                  className="cursor-pointer text-sm font-medium text-sky-700 underline underline-offset-4 transition hover:text-amber-600"
                >
                  {t("viewDetails")}
                </button>
              </div>

              <div className="space-y-2 rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm">
                <p className="flex items-start gap-2 text-sm text-slate-800">
                  <Info className="mt-0.5 h-4 w-4 text-amber-500" />
                  <span>{statusLabel}</span>
                </p>
                {services.map((service) => (
                  <p
                    key={service}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span>{service}</span>
                  </p>
                ))}
                {features.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Info className="mt-0.5 h-4 w-4 text-slate-500" />
                    <span>{feature}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-white/80 p-3 shadow-sm md:col-span-2 lg:col-span-1">
              <div className="h-[240px] w-full overflow-hidden rounded-lg border border-amber-100 md:h-[280px] lg:h-[300px]">
                <iframe
                  title={t("mapTitle")}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.785662718065!2d105.8271836!3d21.041260500000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab57746b2723%3A0xdb0bd2bed69a7797!2sAchi%20Vegan%20House%20(Nh%C3%A0%20Chay%20Achi)!5e0!3m2!1svi!2s!4v1767946996017!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                />
              </div>
              <a
                href="https://www.google.com/maps/place/achi+vegan+house/data=!4m2!3m1!1s0x3135ab57746b2723:0xdb0bd2bed69a7797?sa=X&ved=1t:242&ictx=111"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700 transition hover:text-amber-600"
              >
                {t("mapCta")}
                <ExternalLink className="h-4 w-4" />
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const isFilled = index < fullStars;
                    const isHalf = index === fullStars && hasHalfStar;
                    const colorClass = isFilled
                      ? "text-amber-500"
                      : isHalf
                      ? "text-amber-400/70"
                      : "text-slate-300";
                    return (
                      <Star
                        key={`rating-star-${index}`}
                        className={`h-3.5 w-3.5 ${colorClass}`}
                        fill={isFilled || isHalf ? "currentColor" : "none"}
                      />
                    );
                  })}
                </div>
                <span>
                  {t("mapRatingLabel", {
                    rating: mapRatingValue.toFixed(1),
                    count: mapReviewCount,
                  })}
                </span>
                <span className="text-slate-400">{t("mapRatingSource")}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-amber-100 pt-4 text-xs text-slate-600 md:flex-row">
            <p>{t("legal", { year: new Date().getFullYear() })}</p>
            <Link
              href={`${localePrefix}/privacy-policy`}
              className="font-semibold text-slate-700 underline decoration-amber-400 decoration-2 underline-offset-4 transition hover:text-amber-600"
            >
              {t("privacyPolicy")}
            </Link>
          </div>
        </div>
      </footer>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-100 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{t("modal.title")}</p>
                <p className="text-lg font-semibold text-slate-900">
                  {statusLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="cursor-pointer rounded-full p-2 text-slate-500 transition hover:text-amber-600"
                aria-label={t("modal.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-800">
              {weeklyHours.map((day) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between"
                >
                  <span>{day.day}</span>
                  <span className="tabular-nums">{`${day.start} - ${day.end}`}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm text-slate-900">
                <Clock className="h-4 w-4 text-amber-500" />
                {t("modal.servicesTitle")}
              </p>
              {services.map((service) => (
                <p
                  key={service}
                  className="flex items-start gap-2 text-sm text-slate-800"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{service}</span>
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-6 w-full cursor-pointer rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              {t("modal.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
