/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getLocalePrefix } from "@/lib/routes";
import { ReservationForm } from "@/components/shared/reservation-form";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChefHat, Home, Info, CalendarCheck, PhoneCall } from "lucide-react";

type NavItem = {
  label: string;
  target?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
};
type MenuEntry = NavItem | { type: "language"; label: string; icon?: never };

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuRadius, setMenuRadius] = useState(70);
  const [isLogoVisible, setIsLogoVisible] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [menuHint, setMenuHint] = useState("");
  const [activeMobileHint, setActiveMobileHint] = useState<string | null>(null);
  const isMenuOpenRef = useRef(false);
  const menuOpenedAtRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const isCoarsePointerRef = useRef(false);
  const logoRef = useRef<HTMLButtonElement | null>(null);
  const magneticX = useMotionValue(0);
  const magneticY = useMotionValue(0);
  const springX = useSpring(magneticX, { stiffness: 240, damping: 18 });
  const springY = useSpring(magneticY, { stiffness: 240, damping: 18 });
  const locale = useLocale();
  const t = useTranslations("header");
  const pathname = usePathname();
  const router = useRouter();
  const localeCode = typeof locale === "string" ? locale : "vi";
  const nextLocale = localeCode === "en" ? "vi" : "en";
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const homeHref = localePrefix || "/";
  const isLightHeader =
    pathname.includes("/menu") || pathname.includes("/thuc-don");
  const isMenuVisible = isMenuOpen && isLogoVisible;

  const isHome = useMemo(() => {
    const base = localePrefix || "/";
    if (base === "/") return pathname === "/";
    return pathname === base || pathname === `${base}/`;
  }, [localePrefix, pathname]);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { label: t("products"), href: "/menu", icon: ChefHat },
      { label: t("about"), target: "story", icon: Info },
      { label: t("reservation"), target: "reservation", icon: CalendarCheck },
      { label: t("contact"), target: "contact", icon: PhoneCall },
      // { label: t("blog"), href: "/blog" },
    ];
    if (!isHome && isCompact) {
      items.unshift({ label: t("home"), href: "/", icon: Home });
    }
    return items;
  }, [isCompact, isHome, t]);
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

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.href) {
        router.push(item.href as any);
        setIsMenuOpen(false);
        return;
      }

      if (!item.target) return;

      if (item.target === "reservation") {
        if (isHome) {
          scrollToTarget("reservation");
          setIsMenuOpen(false);
          return;
        }
        setIsMenuOpen(false);
        setIsReservationOpen(true);
        return;
      }

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
    if (!isMenuOpen) {
      setActiveMobileHint(null);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isReservationOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    };
  }, [isReservationOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateRadius = () => {
      const width = window.innerWidth;
      const isNarrow = width < 900;
      const extraSpacing = isNarrow
        ? width < 520
          ? 52
          : width < 768
            ? 36
            : 24
        : 0;
      const baseRadius = isNarrow
        ? Math.round(width * 0.14)
        : Math.round(width * 0.085);
      const nextRadius = Math.min(
        isNarrow ? 170 : 140,
        Math.max(isNarrow ? 80 : 55, baseRadius + extraSpacing),
      );
      setIsCompact(isNarrow);
      setMenuRadius(nextRadius);
    };
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updatePointer = () => {
      const isNarrow = window.innerWidth < 900;
      isCoarsePointerRef.current = window.matchMedia(
        "(hover: none) and (pointer: coarse)",
      ).matches;
      setMenuHint(
        isCoarsePointerRef.current || isNarrow ? "Double tap" : "Hover",
      );
    };
    updatePointer();
    window.addEventListener("resize", updatePointer);
    return () => window.removeEventListener("resize", updatePointer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastScrollYRef.current = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      const prefersTouch = isCoarsePointerRef.current;
      if (currentY < 80) {
        setIsLogoVisible(true);
        lastScrollYRef.current = currentY;
        return;
      }
      if (Math.abs(delta) > 6) {
        const isScrollingUp = delta < 0;
        setIsLogoVisible(isScrollingUp);
        if (isMenuOpen && isHome) {
          setIsMenuOpen(false);
        }
        lastScrollYRef.current = currentY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleUserScrollIntent = () => {
      if (!isMenuOpenRef.current) return;
      if (Date.now() - menuOpenedAtRef.current < 250) return;
      setIsMenuOpen(false);
    };

    window.addEventListener("wheel", handleUserScrollIntent, { passive: true });
    window.addEventListener("touchmove", handleUserScrollIntent, {
      passive: true,
    });
    return () => {
      window.removeEventListener("wheel", handleUserScrollIntent);
      window.removeEventListener("touchmove", handleUserScrollIntent);
    };
  }, []);

  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    if (isCompact) {
      setIsMenuOpen(false);
    }
  }, [isCompact]);

  const handleMouseEnter = () => {
    if (isCompact) return;
    if (isCoarsePointerRef.current) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (isLogoVisible) setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (isCompact) return;
    if (isCoarsePointerRef.current) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 200);
  };

  const handleMagnetMove = (event: MouseEvent) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const pullRadius = 50;
    if (distance < pullRadius) {
      const pull = 0.35;
      magneticX.set(deltaX * pull);
      magneticY.set(deltaY * pull);
    } else {
      magneticX.set(0);
      magneticY.set(0);
    }
  };

  const resetMagnet = () => {
    magneticX.set(0);
    magneticY.set(0);
  };

  const orbitVariants: Variants = {
    open: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
    closed: {
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants: Variants = {
    open: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 18 },
    },
    closed: {
      opacity: 0,
      scale: 0.7,
      transition: { duration: 0.2 },
    },
  };

  return (
    <>
      {isReservationOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setIsReservationOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="reservation-scroll max-h-[85vh] overflow-y-auto overscroll-contain pr-5"
              onWheel={(event) => event.stopPropagation()}
            >
              <div className="relative">
                <button
                  type="button"
                  className="absolute right-6 top-6 z-10 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black/70 hover:bg-white"
                  onClick={() => setIsReservationOpen(false)}
                >
                  Close
                </button>
                <ReservationForm
                  onSuccess={() => setIsReservationOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center">
        <div className="relative flex flex-col items-center">
          <div
            className={`fixed inset-0 z-10 bg-black/30 transition-opacity duration-200 ${
              isMenuOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            onPointerDown={() => setIsMenuOpen(false)}
          />

          <div
            className={`relative z-20 ${
              isLogoVisible ? "pointer-events-auto" : "pointer-events-none"
            }`}
            onMouseMove={handleMagnetMove}
            onMouseLeave={() => {
              handleMouseLeave();
              resetMagnet();
            }}
          >
            <div
              className={`transition-all duration-300 ease-out ${
                isLogoVisible
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0"
              }`}
            >
              <div
                className={`absolute -top-14 left-1/2 -translate-x-1/2 text-center text-[11px] font-semibold uppercase tracking-[0.4em] ${
                  isLightHeader ? "text-black/60" : "text-white/70"
                }`}
              >
                {menuHint}
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
                  stroke={
                    isLightHeader ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)"
                  }
                  strokeWidth="2"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                />
                <path
                  d="M124 46 L132 50 L124 54"
                  stroke={
                    isLightHeader ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="relative h-[220px] w-[320px] md:h-[260px] md:w-[420px]">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  variants={orbitVariants}
                  animate={isMenuVisible ? "open" : "closed"}
                  initial="closed"
                >
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
                          <motion.div variants={itemVariants}>
                            <div
                              className={
                                isMenuVisible
                                  ? "pointer-events-auto"
                                  : "pointer-events-none"
                              }
                            >
                              <div
                                className={`flex h-11 items-center rounded-full border px-1 shadow-lg backdrop-blur transition cursor-pointer ${
                                  isLightHeader
                                    ? "border-black/40 bg-white/70 text-black/90"
                                    : "border-white/40 bg-white/20 text-white"
                                }`}
                                aria-label="Language"
                                role="group"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (localeCode !== "vi") {
                                      router.replace(pathname as any, {
                                        locale: "vi",
                                      });
                                    }
                                  }}
                                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] transition ${
                                    localeCode === "vi"
                                      ? "bg-emerald-400/80 text-black"
                                      : ""
                                  }`}
                                  aria-pressed={localeCode === "vi"}
                                >
                                  <img
                                    src="/Flag/vn.png"
                                    alt="Vietnam"
                                    className="h-4 w-4 rounded-[3px] object-cover"
                                    loading="lazy"
                                  />
                                  VI
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (localeCode !== "en") {
                                      router.replace(pathname as any, {
                                        locale: "en",
                                      });
                                    }
                                  }}
                                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] transition ${
                                    localeCode === "en"
                                      ? "bg-emerald-400/80 text-black"
                                      : ""
                                  }`}
                                  aria-pressed={localeCode === "en"}
                                >
                                  <img
                                    src="/Flag/usa.png"
                                    alt="English"
                                    className="h-4 w-4 rounded-[3px] object-cover"
                                    loading="lazy"
                                  />
                                  EN
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    }
                    const isActive =
                      "href" in item && item.href
                        ? pathname.endsWith(item.href)
                        : false;
                    return (
                      <div
                        key={item.label}
                        className="absolute left-1/2 top-1/2"
                        style={sharedStyle}
                      >
                        <motion.div variants={itemVariants}>
                          <div
                            className={
                              isMenuVisible
                                ? "pointer-events-auto"
                                : "pointer-events-none"
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (isCompact) {
                                  if (activeMobileHint !== item.label) {
                                    setActiveMobileHint(item.label);
                                    return;
                                  }
                                  setActiveMobileHint(null);
                                }
                                handleNavClick(item);
                              }}
                              className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] shadow-lg backdrop-blur transition ${
                                isLightHeader
                                  ? "border border-black/40 bg-white/70 text-black/90 shadow-[0_10px_26px_rgba(0,0,0,0.12)] hover:border-emerald-700/60 hover:bg-emerald-600/20 hover:text-emerald-950"
                                  : "border border-white/40 bg-white/20 text-white hover:border-emerald-200 hover:bg-emerald-200/30 hover:text-white"
                              } ${isCompact ? "h-11 w-11 p-0" : ""}`}
                            >
                              {item.icon && isCompact ? (
                                <span className="relative flex h-full w-full items-center justify-center rounded-full border border-transparent">
                                  <item.icon className="h-7 w-7" />
                                  {activeMobileHint === item.label ? (
                                    <span
                                      className={`absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] ${
                                        isLightHeader
                                          ? "bg-white/90 text-black/80"
                                          : "bg-black/70 text-white/80"
                                      }`}
                                    >
                                      {item.label}
                                    </span>
                                  ) : null}
                                  {isActive ? (
                                    <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                                  ) : null}
                                </span>
                              ) : (
                                item.label
                              )}
                              {!isCompact && isActive ? (
                                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                              ) : null}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}

                  <div
                    className={`absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-emerald-200/10 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition ${
                      isMenuVisible ? "scale-110" : "scale-100"
                    }`}
                    aria-hidden="true"
                  />
                </motion.div>
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
                      <stop
                        offset="60%"
                        stopColor="#ffffff"
                        stopOpacity="0.1"
                      />
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

              <motion.button
                type="button"
                aria-label={t("brandName")}
                aria-expanded={isMenuOpen}
                className={`pointer-events-auto absolute left-1/2 top-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition hover:scale-105 cursor-pointer ${
                  isLightHeader
                    ? "border-black/20 bg-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                    : "border-white/30 bg-black/70 shadow-[0_12px_45px_rgba(0,0,0,0.45)]"
                }`}
                ref={logoRef}
                style={{ x: springX, y: springY }}
                onClick={() => {
                  if (!isHome) {
                    if (isCompact || isCoarsePointerRef.current) {
                      setIsMenuOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          menuOpenedAtRef.current = Date.now();
                          lastScrollYRef.current = window.scrollY;
                        }
                        return next;
                      });
                      return;
                    }
                    router.push("/" as any);
                    setIsMenuOpen(false);
                    return;
                  }
                  setIsMenuOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      menuOpenedAtRef.current = Date.now();
                      lastScrollYRef.current = window.scrollY;
                    }
                    return next;
                  });
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  handleMouseEnter();
                }}
              >
                <Image
                  src="/Logo/Logo1.jpg"
                  alt={t("brandName")}
                  width={80}
                  height={80}
                  className="h-14 w-14 rounded-full object-cover"
                  priority
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
