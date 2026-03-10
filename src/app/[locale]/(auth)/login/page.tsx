/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { getLocalePrefix } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = String(params?.locale || "vi");
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const adminPath = `${localePrefix}/admin`;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            locale === "vi"
              ? "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."
              : "Too many login attempts. Please try again in 15 minutes."
          );
        }
        const data = await safeJson(res);
        throw new Error(data?.message || "Đăng nhập thất bại");
      }

      const raw = searchParams.get("next") || adminPath;
      const nextUrl = isInternalPath(raw) ? raw : adminPath;
      router.replace(nextUrl);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-neutral-950">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/Logo/Home1.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-emerald-950/60" />
      </div>

      {/* Emerald ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/8 blur-[160px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] px-4">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/50 shadow-[0_40px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl">

          {/* Top gradient line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="px-8 py-10">
            {/* Brand header */}
            <div className="mb-9 text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-emerald-400"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <h1
                style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
                className="text-2xl font-semibold tracking-wide text-white"
              >
                Achi Vegan House
              </h1>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">
                Studio Console
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="*******"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder-white/20 outline-none ring-0 transition duration-200 focus:border-emerald-400/40 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-emerald-400/25"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45"
                >
                  {locale === "vi" ? "Mật khẩu" : "Password"}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 pr-12 text-sm text-white placeholder-white/20 outline-none transition duration-200 focus:border-emerald-400/40 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-emerald-400/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-white/25 transition hover:text-white/55"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/15 bg-red-500/8 px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-red-400">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs leading-relaxed text-red-300">{error}</p>
                </div>
              ) : null}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-medium text-white shadow-[0_6px_28px_rgba(16,185,129,0.28)] transition duration-200 hover:bg-emerald-400 hover:shadow-[0_8px_32px_rgba(16,185,129,0.38)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {locale === "vi" ? "Đang đăng nhập..." : "Signing in..."}
                    </>
                  ) : (
                    locale === "vi" ? "Đăng nhập" : "Sign in"
                  )}
                </span>
              </button> 
            </form>
          </div>
          {/* Footer */}
          <div className="border-t border-white/5 px-8 py-3.5">
            <p className="text-center text-[10px] tracking-wide text-white/18">
              © {new Date().getFullYear()} Achi Vegan House &middot; Restricted access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isInternalPath(url: string): boolean {
  if (!url.startsWith("/")) return false;
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.origin === "http://localhost";
  } catch {
    return false;
  }
}
