"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  const smoothScrollToTop = () => {
    const start = window.scrollY || document.documentElement.scrollTop;
    const duration = 700; // ms
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      window.scrollTo({ top: start * (1 - eased), behavior: "auto" });
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setVisible(y > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={smoothScrollToTop}
      className="fixed bottom-24 right-6 z-[95] inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-300 text-white shadow-lg shadow-emerald-200/50 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
