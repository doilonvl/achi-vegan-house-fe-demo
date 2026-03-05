"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import type { LenisOptions } from "lenis";

type ClientLayoutProps = {
  children: ReactNode;
};

const LenisScrollSync = () => {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    let cleanup: (() => void) | undefined;

    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop(value) {
          if (typeof value === "number") {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: document.documentElement.style.transform ? "transform" : "fixed",
      });

      ScrollTrigger.refresh();

      cleanup = () => {
        lenis.off("scroll", onScroll);
        ScrollTrigger.scrollerProxy(document.documentElement, {});
      };
    });

    return () => cleanup?.();
  }, [lenis]);

  return null;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const isNoScrollRoute =
    pathname.includes("/admin") || pathname.includes("/login");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1000);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scrollSettings: LenisOptions = isMobile
    ? {
        duration: 0.8,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        gestureOrientation: "vertical",
        touchMultiplier: 1.5,
        infinite: false,
        lerp: 0.09,
        wheelMultiplier: 1,
        orientation: "vertical",
        smoothWheel: true,
        syncTouch: true,
      }
    : {
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        gestureOrientation: "vertical",
        touchMultiplier: 2,
        infinite: false,
        lerp: 0.1,
        wheelMultiplier: 1,
        orientation: "vertical",
        smoothWheel: true,
        syncTouch: true,
      };

  if (isNoScrollRoute) {
    return (
      <div className="page" ref={pageRef}>
        {children}
      </div>
    );
  }

  return (
    <ReactLenis root options={scrollSettings}>
      <LenisScrollSync />
      <div className="page" ref={pageRef}>
        {children}
      </div>
    </ReactLenis>
  );
}
