"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type BlogContentZoomProps = {
  children: React.ReactNode;
};

export default function BlogContentZoom({ children }: BlogContentZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [zoomAlt, setZoomAlt] = useState("");

  const close = useCallback(() => {
    setZoomSrc(null);
    setZoomAlt("");
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const figure = target.closest("figure");
      if (!figure) return;

      const img = figure.querySelector("img");
      if (!img) return;

      e.preventDefault();
      setZoomSrc(img.src);
      setZoomAlt(img.alt || "");
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!zoomSrc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [zoomSrc, close]);

  return (
    <>
      <div ref={containerRef} className="[&_figure:has(img)]:cursor-zoom-in [&_figure]:relative [&_figure]:group">
        {children}
      </div>
      {zoomSrc
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={close}
            >
              <button
                onClick={close}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomSrc}
                alt={zoomAlt}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
