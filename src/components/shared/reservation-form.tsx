"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useCreateReservationRequestMutation } from "@/services/api";
import type { ReservationRequestPayload } from "@/types/reservation";

// All the logic and helper functions from the original file are preserved
const NAME_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;
const OPENING_HOURS = {
  start: "10:00",
  end: "22:00",
};

function buildReservationSchema(t: ReturnType<typeof useTranslations>) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .transform(normalizeName)
        .refine((val) => val.length >= 3, {
          message: t("validation.fullNameMin"),
        })
        .refine((val) => val.length <= 80, {
          message: t("validation.fullNameMax"),
        })
        .refine((val) => NAME_REGEX.test(val), {
          message: t("validation.fullNamePattern"),
        })
        .refine((val) => val.split(/\s+/).filter(Boolean).length >= 2, {
          message: t("validation.fullNameParts"),
        }),
      phoneNumber: z
        .string()
        .trim()
        .refine(isValidPhoneNumber, {
          message: t("validation.phone"),
        }),
      email: z
        .string()
        .trim()
        .email(t("validation.email"))
        .optional()
        .or(z.literal("")),
      guestCount: z
        .number()
        .int()
        .min(1, t("validation.guestMin"))
        .max(30, t("validation.guestMax")),
      reservationDate: z.string().min(1, t("validation.dateRequired")),
      reservationTime: z.string().min(1, t("validation.timeRequired")),
      note: z
        .string()
        .trim()
        .max(400, t("validation.noteMax"))
        .optional()
        .or(z.literal("")),
    })
    .superRefine((values, ctx) => {
      const reservationDateTime = buildDateTime(
        values.reservationDate,
        values.reservationTime
      );
      if (!reservationDateTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reservationTime"],
          message: t("validation.timeInvalid"),
        });
        return;
      }

      const timeMinutes = timeToMinutes(values.reservationTime);
      const openingStartMinutes = timeToMinutes(OPENING_HOURS.start);
      const openingEndMinutes = timeToMinutes(OPENING_HOURS.end);
      if (
        timeMinutes === null ||
        openingStartMinutes === null ||
        openingEndMinutes === null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reservationTime"],
          message: t("validation.timeInvalid"),
        });
        return;
      }

      if (
        timeMinutes < openingStartMinutes ||
        timeMinutes > openingEndMinutes
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reservationTime"],
          message: t("validation.timeOutsideHours"),
        });
      }

      const now = new Date();
      if (reservationDateTime.getTime() < now.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reservationDate"],
          message: t("validation.timePast"),
        });
      }
    });
}

type ReservationFormValues = z.infer<ReturnType<typeof buildReservationSchema>>;

function buildDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const isValid =
    [year, month, day, hour, minute].every(
      (part) => typeof part === "number" && !Number.isNaN(part)
    ) &&
    month >= 1 &&
    month <= 12;
  if (!isValid) return null;
  const candidate = new Date(year, month - 1, day, hour, minute, 0);
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getMonth() + 1 !== month ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return candidate;
}

function isValidPhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  const normalized = digitsOnly.startsWith("84")
    ? digitsOnly.slice(2)
    : digitsOnly.startsWith("0")
    ? digitsOnly.slice(1)
    : digitsOnly;
  return /^[1-9]\d{8}$/.test(normalized);
}

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+84"))
    return `0${trimmed.replace(/\D/g, "").slice(2)}`;
  if (trimmed.startsWith("84"))
    return `0${trimmed.replace(/\D/g, "").slice(2)}`;
  return trimmed.replace(/\s+/g, "");
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string) {
  const [hourString, minuteString] = value.split(":");
  if (!hourString || !minuteString) return null;
  const hour = Number(hourString);
  const minute = Number(minuteString);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function ReservationForm({
  onSuccess,
}: {
  onSuccess?: (data: ReservationRequestPayload) => void;
}) {
  const t = useTranslations("reservation");
  const locale = useLocale();
  const schema = useMemo(() => buildReservationSchema(t), [t]);
  const defaultDate = useMemo(() => formatDateInput(new Date()), []);
  const [minSelectableTime, setMinSelectableTime] = useState<
    string | undefined
  >(undefined);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      guestCount: 2,
      reservationDate: defaultDate,
      reservationTime: "19:00",
      note: "",
    },
  });
  const [createReservationRequest, { isLoading }] =
    useCreateReservationRequestMutation();
  const watchDate = watch("reservationDate");

  useEffect(() => {
    // This logic remains unchanged
    const openingStartMinutes = timeToMinutes(OPENING_HOURS.start);
    const openingEndMinutes = timeToMinutes(OPENING_HOURS.end);
    if (openingStartMinutes === null || openingEndMinutes === null) {
      setMinSelectableTime(undefined);
      return;
    }
    if (watchDate !== defaultDate) {
      setMinSelectableTime(OPENING_HOURS.start);
      return;
    }
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const minMinutes = Math.max(openingStartMinutes, nowMinutes);
    const boundedMinMinutes = Math.min(minMinutes, openingEndMinutes);
    setMinSelectableTime(minutesToTime(boundedMinMinutes));
  }, [watchDate, defaultDate]);

  const isBusy = isSubmitting || isLoading;

  const onSubmit = async (values: ReservationFormValues) => {
    const payload: ReservationRequestPayload = {
      fullName: values.fullName,
      phoneNumber: normalizePhoneNumber(values.phoneNumber),
      email: values.email?.trim() || undefined,
      guestCount: values.guestCount,
      reservationDate: values.reservationDate,
      reservationTime: values.reservationTime,
      note: values.note?.trim() || undefined,
      source: "website",
      locale,
    };

    try {
      await createReservationRequest(payload).unwrap();
      toast.success(t("successTitle"), { description: t("successDesc") });
      setSubmitted(true);
      onSuccess?.(payload);
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        t("errorDesc");
      toast.error(t("errorTitle"), { description: message });
    }
  };

  const handleModify = () => {
    setSubmitted(false);
    reset();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-0 overflow-hidden rounded-[32px] border border-emerald-900/10 bg-[#f6f1e6] shadow-[0_40px_120px_rgba(18,22,14,0.25)] lg:grid-cols-[1fr_1.2fr]">
        <div className="relative min-h-[320px] lg:min-h-full">
          <img
            src="/intro/in1.jpg"
            alt="Achi Vegan House"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-10 text-white">
            <span className="text-xs uppercase tracking-[0.5em] text-white/70">
              {t("sectionTitle")}
            </span>
            <p className="mt-6 font-[var(--font-playfair)] text-3xl font-semibold leading-tight">
              {t("heading")}
            </p>
            <p className="mt-4 text-sm text-white/70">{t("description")}</p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              {t("openingHourLabel")} 10:00 - 22:00
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12 lg:p-16">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-700/30">
                <div className="h-3 w-3 rounded-full bg-emerald-600" />
              </div>
              <h3 className="mb-6 font-[var(--font-playfair)] text-4xl text-emerald-900">
                {t("successTitle")}
              </h3>
              <p className="mb-10 max-w-sm text-sm leading-relaxed text-emerald-900/70">
                {t("successDesc")}
              </p>
              <button
                onClick={handleModify}
                className="border-b border-emerald-700/60 pb-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-800/70 hover:text-emerald-900"
              >
                Make Another Reservation
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-800/60">
                  {t("sectionTitle")}
                </span>
                <h2 className="mt-4 font-[var(--font-playfair)] text-4xl text-emerald-900">
                  {t("heading")}
                </h2>
                <p className="mt-4 text-sm text-emerald-900/70">
                  {t("arrivalNote")}
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                      {t("fullNameLabel")}
                    </label>
                    <input
                      {...register("fullName")}
                      className="w-full border-b border-emerald-900/15 bg-transparent py-3 text-base text-emerald-900 focus:border-emerald-600 focus:outline-none"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-600">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                      {t("phoneLabel")}
                    </label>
                    <input
                      {...register("phoneNumber")}
                      type="tel"
                      className="w-full border-b border-emerald-900/15 bg-transparent py-3 text-base text-emerald-900 focus:border-emerald-600 focus:outline-none"
                      aria-invalid={Boolean(errors.phoneNumber)}
                    />
                    {errors.phoneNumber && (
                      <p className="text-xs text-red-600">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                    {t("emailLabel")}
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full border-b border-emerald-900/15 bg-transparent py-3 text-base text-emerald-900 focus:border-emerald-600 focus:outline-none"
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                      {t("dateLabel")}
                    </label>
                    <input
                      {...register("reservationDate")}
                      type="date"
                      min={defaultDate}
                      className="w-full appearance-none border-b border-emerald-900/15 bg-transparent py-3 text-sm text-emerald-900 focus:border-emerald-600 focus:outline-none"
                      aria-invalid={Boolean(errors.reservationDate)}
                    />
                    {errors.reservationDate && (
                      <p className="text-xs text-red-600">
                        {errors.reservationDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                      {t("timeLabel")}
                    </label>
                    <input
                      {...register("reservationTime")}
                      type="time"
                      min={minSelectableTime}
                      max={OPENING_HOURS.end}
                      className="w-full appearance-none border-b border-emerald-900/15 bg-transparent py-3 text-sm text-emerald-900 focus:border-emerald-600 focus:outline-none"
                      aria-invalid={Boolean(errors.reservationTime)}
                    />
                    {errors.reservationTime && (
                      <p className="text-xs text-red-600">
                        {errors.reservationTime.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                      {t("guestLabel")}
                    </label>
                    <select
                      {...register("guestCount", { valueAsNumber: true })}
                      className="w-full border-b border-emerald-900/15 bg-transparent py-3 text-sm text-emerald-900 focus:border-emerald-600 focus:outline-none"
                      aria-invalid={Boolean(errors.guestCount)}
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30].map((n) => (
                        <option key={n} value={n}>
                          {n === 1
                            ? `${n} ${t("guestSingular")}`
                            : t("guestPlural", { count: n })}
                        </option>
                      ))}
                    </select>
                    {errors.guestCount && (
                      <p className="text-xs text-red-600">
                        {errors.guestCount.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-emerald-900/60 font-semibold">
                    {t("noteLabel")}
                  </label>
                  <textarea
                    {...register("note")}
                    rows={2}
                    placeholder={t("notePlaceholder")}
                    className="w-full border-b border-emerald-900/15 bg-transparent py-3 text-base text-emerald-900 focus:border-emerald-600 focus:outline-none"
                    aria-invalid={Boolean(errors.note)}
                  />
                  {errors.note && (
                    <p className="text-xs text-red-600">
                      {errors.note.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="mt-8 w-full rounded-full bg-emerald-800 py-5 text-xs font-semibold uppercase tracking-[0.4em] text-white transition-all duration-300 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isBusy ? t("submitting") : t("submit")}
                </button>
                <p className="pt-4 text-center text-xs text-emerald-900/60">
                  {t("privacy")}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
