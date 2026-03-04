"use client";

import { useEffect, useRef, useState } from "react";

const DIRECTION_STYLES = {
  up: "translate3d(0, 30px, 0)",
  down: "translate3d(0, -30px, 0)",
  left: "translate3d(-30px, 0, 0)",
  right: "translate3d(30px, 0, 0)",
} as const;

export default function FadeIn({
  children,
  delay = 0,
  once = true,
  amount = 0.1,
  direction = "up",
  margin = "-10% 0px -10% 0px",
}: {
  children: React.ReactNode;
  delay?: number;
  once?: boolean;
  amount?: number;
  direction?: "up" | "down" | "left" | "right";
  margin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: amount, rootMargin: margin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount, margin, once]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0,0,0)" : DIRECTION_STYLES[direction],
        transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
