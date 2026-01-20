/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getLocalePrefix } from "@/lib/routes";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Menu } from "lucide-react";
import gsap from "gsap";

type NavItem = {
  label: string;
  target?: string;
  href?: string;
};
type MenuEntry = NavItem | { type: "language"; label: string };

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [menuRadius, setMenuRadius] = useState(70);
  const [isLogoVisible, setIsLogoVisible] = useState(true);
  const lastScrollYRef = useRef(0);
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
    [t],
  );
  const menuItems = useMemo<MenuEntry[]>(() => {
    const items = [...navItems];
    const languageEntry: MenuEntry = {
      label: t("openMenu"),
      type: "language",
    };
    if (items.length === 0) return [languageEntry];

    const [menuEntry, ...rest] = items;
    return [languageEntry, ...rest, menuEntry];
  }, [navItems, t]);

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
    const items = menuItemRefs.current.filter(Boolean);
    if (!items.length) return;

    if (isMenuOpen) {
      gsap.fromTo(
        items,
        { opacity: 0, scale: 0.7 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          transformOrigin: "center center",
        },
      );
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.2,
          ease: "power1.out",
        });
      }
    } else {
      gsap.to(items, {
        opacity: 0,
        scale: 0.85,
        duration: 0.2,
        ease: "power2.in",
        transformOrigin: "center center",
      });
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.2,
          ease: "power1.in",
        });
      }
    }
  }, [isMenuOpen]);

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
    [homeHref, isHome, router, scrollToFooter, scrollToTarget],
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateRadius = () => {
      const width = window.innerWidth;
      const nextRadius = Math.min(110, Math.max(55, Math.round(width * 0.085)));
      setMenuRadius(nextRadius);
    };
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastScrollYRef.current = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      if (Math.abs(delta) > 6) {
        setIsLogoVisible(delta < 0);
        lastScrollYRef.current = currentY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 200);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <div className="relative flex flex-col items-center">
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-10 bg-black/30 transition-opacity duration-200 ${
            isMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onPointerDown={() => setIsMenuOpen(false)}
        />

        <div
          className="pointer-events-auto relative z-20"
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`transition-all duration-300 ease-out ${
              isLogoVisible
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
          >
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">
              Tap / Hover
            </div>
            <svg
              className="absolute -top-10 left-1/2 -translate-x-1/2"
              width="140"
              height="60"
              viewBox="0 0 140 60"
              fill="none"
            >
              <path
                d="M10 50 C40 10, 100 10, 130 50"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="2"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
              <path
                d="M124 46 L132 50 L124 54"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="relative h-[220px] w-[320px] md:h-[260px] md:w-[420px]">
              <div className="absolute inset-0 flex items-center justify-center">
                {menuItems.map((item, index) => {
                  const total = menuItems.length;
                  const step = total > 0 ? 360 / total : 0;
                  const angle = -90 + step * index;
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.cos(rad) * menuRadius;
                  const y = Math.sin(rad) * menuRadius;
                  const sharedStyle: CSSProperties = {
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  } as CSSProperties;

                  if ("type" in item && item.type === "language") {
                    return (
                      <div
                        key="language-switcher"
                        className="absolute left-1/2 top-1/2"
                        style={sharedStyle}
                      >
                        <div
                          ref={(el) => {
                            menuItemRefs.current[index] = el;
                          }}
                          className={`opacity-0 scale-90 ${
                            isMenuOpen
                              ? "pointer-events-auto"
                              : "pointer-events-none"
                          }`}
                        >
                          <LanguageSwitcher />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={item.label}
                      className="absolute left-1/2 top-1/2"
                      style={sharedStyle}
                    >
                      <div
                        ref={(el) => {
                          menuItemRefs.current[index] = el;
                        }}
                        className={`opacity-0 scale-90 ${
                          isMenuOpen
                            ? "pointer-events-auto"
                            : "pointer-events-none"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleNavClick(item)}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white shadow-lg backdrop-blur transition hover:border-emerald-200 hover:bg-emerald-200/30 hover:text-white"
                        >
                          {item.label}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div
                  className={`absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-emerald-200/10 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition ${
                    isMenuOpen ? "scale-110" : "scale-100"
                  }`}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div
              className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isLogoVisible
                  ? "scale-100 opacity-100 rotate-0"
                  : "scale-50 opacity-0 rotate-45"
              }`}
              aria-hidden="true"
            >
              <svg
                width="380"
                height="380"
                viewBox="0 0 380 380"
                fill="none"
                className="overflow-visible"
              >
                <defs>
                  {/* Hiệu ứng phát sáng nhẹ cho cánh hoa */}
                  <filter
                    id="glow-bloom"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>

                  {/* Gradient cho cuống hoa: Xanh nhạt sang trong suốt */}
                  <linearGradient
                    id="stemGradient"
                    x1="180"
                    y1="200"
                    x2="180"
                    y2="380"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
                  </linearGradient>

                  {/* Gradient cho cánh hoa: Vàng nhạt ở tâm -> Trắng/Xanh ở đỉnh */}
                  <linearGradient
                    id="petalGradient"
                    x1="0"
                    y1="1"
                    x2="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.3" />{" "}
                    {/* Vàng nhạt */}
                    <stop offset="60%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop
                      offset="100%"
                      stopColor="#a7f3d0"
                      stopOpacity="0.6"
                    />{" "}
                    {/* Xanh ngọc */}
                  </linearGradient>
                </defs>

                {/* Phần cuống hoa: Vẽ uốn lượn tự nhiên hơn */}
                <path
                  d="M190 380 C188 340, 150 300, 160 260 C165 240, 180 230, 180 210"
                  stroke="url(#stemGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="opacity-60"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: isLogoVisible ? 0 : 200,
                    transition: "stroke-dashoffset 1s ease-out",
                  }}
                />

                {/* Nhóm Cánh Hoa: Scale từ tâm ra */}
                <g
                  style={{
                    transformOrigin: "190px 190px", // Căn lại tâm (380/2)
                    transform: `scale(${isLogoVisible ? 1 : 0.5})`,
                    transition:
                      "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s",
                  }}
                >
                  {/* Lớp 1: Cánh lớn bên ngoài (8 cánh) - Tạo nền */}
                  {Array.from({ length: 8 }).map((_, index) => {
                    const angle = index * 45;
                    return (
                      <path
                        key={`petal-outer-${angle}`}
                        // Hình dáng cánh hoa sen bầu tròn và nhọn ở đỉnh
                        d="M190 190 Q165 140, 190 100 Q215 140, 190 190"
                        transform={`rotate(${angle} 190 190)`}
                        fill="url(#petalGradient)"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="1"
                        filter="url(#glow-bloom)"
                        className="opacity-60"
                      />
                    );
                  })}

                  {/* Lớp 2: Cánh chính đan xen (8 cánh, xoay lệch 22.5 độ) */}
                  {Array.from({ length: 8 }).map((_, index) => {
                    const angle = index * 45 + 22.5;
                    return (
                      <path
                        key={`petal-mid-${angle}`}
                        // Cánh này thon hơn và dài hơn một chút
                        d="M190 190 C170 150, 175 120, 190 90 C205 120, 210 150, 190 190"
                        transform={`rotate(${angle} 190 190)`}
                        stroke="rgba(167, 243, 208, 0.8)" // Viền xanh ngọc sáng
                        strokeWidth="1.2"
                        fill="rgba(255,255,255, 0.05)"
                      />
                    );
                  })}

                  {/* Lớp 3: Nhụy hoa / Cánh tâm (6 cánh nhỏ) */}
                  {Array.from({ length: 6 }).map((_, index) => {
                    const angle = index * 60;
                    return (
                      <path
                        key={`petal-inner-${angle}`}
                        d="M190 190 Q182 170, 190 155 Q198 170, 190 190"
                        transform={`rotate(${angle} 190 190)`}
                        stroke="#fef08a" // Viền vàng
                        strokeWidth="1.5"
                        fill="rgba(254, 240, 138, 0.2)"
                      />
                    );
                  })}

                  {/* Vòng tròn hào quang mờ xung quanh logo */}
                  <circle
                    cx="190"
                    cy="190"
                    r="42"
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                    className="animate-spin-slow"
                    style={{ animationDuration: "10s" }}
                  />
                </g>
              </svg>
            </div>

            <button
              type="button"
              aria-label={t("brandName")}
              aria-expanded={isMenuOpen}
              className="pointer-events-auto absolute left-1/2 top-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 shadow-[0_12px_45px_rgba(0,0,0,0.45)] backdrop-blur transition hover:scale-105 cursor-pointer"
              onClick={() => {
                if (!isHome) {
                  router.push("/" as any);
                  setIsMenuOpen(false);
                  return;
                }
                setIsMenuOpen((prev) => !prev);
              }}
              onMouseEnter={handleMouseEnter}
            >
              <Image
                src="/Logo/Logo1.jpg"
                alt={t("brandName")}
                width={80}
                height={80}
                className="h-14 w-14 rounded-full object-cover"
                priority
              />
            </button>
          </div>

          <div className="sr-only">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
