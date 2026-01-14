"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./MenuShowcase.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MenuPage = {
  src: string;
  label: string;
};

type MenuShowcaseProps = {
  eyebrow: string;
  title: string;
  tagline: string;
  highlights: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  ctaNote: string;
  primaryHref: string;
  secondaryHref: string;
  sectionTitle: string;
  sectionSubtitle: string;
  indexTitle: string;
  pages: MenuPage[];
};

const MenuShowcase = ({
  eyebrow,
  title,
  tagline,
  highlights,
  ctaPrimary,
  ctaSecondary,
  ctaNote,
  primaryHref,
  secondaryHref,
  sectionTitle,
  sectionSubtitle,
  indexTitle,
  pages,
}: MenuShowcaseProps) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const deckWrapperRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFloatingIndex, setShowFloatingIndex] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(false);

  const pageCount = useMemo(() => pages.length, [pages.length]);
  const updateActiveIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, index));
    if (activeIndexRef.current === clamped) return;
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
  };
  const handleIndexClick = (index: number, closePanel = false) => {
    updateActiveIndex(index);
    const scrollTrigger = scrollTriggerRef.current;

    if (
      scrollTrigger &&
      typeof scrollTrigger.start === "number" &&
      typeof scrollTrigger.end === "number"
    ) {
      const total = Math.max(1, pageCount);
      const progress = Math.max(0, Math.min(1, index / total));
      const target =
        scrollTrigger.start +
        (scrollTrigger.end - scrollTrigger.start) * progress;
      window.scrollTo({ top: target, behavior: "smooth" });
      if (closePanel) setIsIndexOpen(false);
      return;
    }

    const card = cardRefs.current[index];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (closePanel) setIsIndexOpen(false);
  };

  useEffect(() => {
    const target = indexRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldShow = !entry.isIntersecting;
        setShowFloatingIndex(shouldShow);
        if (!shouldShow) {
          setIsIndexOpen(false);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const deck = deckRef.current;
      const wrapper = deckWrapperRef.current;
      if (!section || !deck || !wrapper) return;

      const cards = gsap.utils.toArray<HTMLDivElement>(
        deck.querySelectorAll(`.${styles.menuCard}`)
      );

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1000px)", () => {
        gsap.set(deck, { perspective: 1400 });

        cards.forEach((card, index) => {
          gsap.set(card, {
            yPercent: index * 6,
            rotation: index % 2 === 0 ? -2 : 2,
            scale: 1 - index * 0.02,
            zIndex: cards.length - index,
          });
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${cards.length * 120}%`,
            scrub: 1,
            pin: wrapper,
            pinSpacing: true,
            onUpdate: (self) => {
              const total = Math.max(1, cards.length);
              const index = Math.round(self.progress * total);
              updateActiveIndex(index);
            },
          },
        });

        scrollTriggerRef.current = timeline.scrollTrigger ?? null;

        cards.forEach((card, index) => {
          timeline.to(
            card,
            {
              yPercent: -120,
              rotation: index % 2 === 0 ? -10 : 10,
              scale: 0.92,
              opacity: 0,
              ease: "none",
              duration: 1,
            },
            index
          );
        });

        const refreshHandler = () => ScrollTrigger.refresh();
        window.addEventListener("resize", refreshHandler);

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
          scrollTriggerRef.current = null;
          window.removeEventListener("resize", refreshHandler);
        };
      });

      mm.add("(max-width: 999px)", () => {
        cards.forEach((card) => {
          gsap.set(card, { clearProps: "all" });
        });
        gsap.set(deck, { clearProps: "all" });
        updateActiveIndex(0);
        scrollTriggerRef.current = null;
        ScrollTrigger.refresh();

        return () => {
          ScrollTrigger.refresh();
        };
      });

      return () => {
        mm.revert();
        scrollTriggerRef.current = null;
      };
    },
    { scope: sectionRef, dependencies: [pageCount] }
  );

  return (
    <section className={styles.menuShowcase} ref={sectionRef}>
      <div className={styles.menuCopy}>
        <p className={styles.menuEyebrow}>{eyebrow}</p>
        <h1 className={styles.menuTitle}>{title}</h1>
        <p className={styles.menuTagline}>{tagline}</p>

        <div className={styles.menuBadges}>
          {highlights.map((item) => (
            <span key={item} className={styles.menuBadge}>
              {item}
            </span>
          ))}
        </div>

        <div className={styles.menuIndex} ref={indexRef}>
          <p className={styles.menuIndexTitle}>{indexTitle}</p>
          <ul className={styles.menuIndexList}>
            {pages.map((page, index) => (
              <li
                key={page.src}
                className={`${styles.menuIndexItem} ${
                  index === activeIndex ? styles.menuIndexItemActive : ""
                }`}
              >
                <button
                  type="button"
                  className={styles.menuIndexButton}
                  onClick={() => handleIndexClick(index)}
                  aria-current={index === activeIndex ? "true" : undefined}
                  aria-label={page.label}
                >
                  <span className={styles.menuIndexIcon} aria-hidden="true" />
                  <span className={styles.menuIndexNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.menuIndexLabel}>{page.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.menuActions}>
          <Link href={primaryHref} className={styles.menuPrimaryCta}>
            {ctaPrimary}
          </Link>
          <Link href={secondaryHref} className={styles.menuSecondaryCta}>
            {ctaSecondary}
          </Link>
        </div>

        <p className={styles.menuNote}>{ctaNote}</p>
      </div>

      <div className={styles.menuDeckWrapper} ref={deckWrapperRef}>
        <div className={styles.menuDeck} ref={deckRef}>
          {pages.map((page, index) => (
            <figure
              className={styles.menuCard}
              key={page.src}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
            >
              <div className={styles.menuCardFrame}>
                <img
                  src={page.src}
                  alt={page.label}
                  className={styles.menuCardImage}
                  loading="lazy"
                />
              </div>
              <figcaption className={styles.menuCardLabel}>
                {page.label}
              </figcaption>
            </figure>
          ))}
        </div>
        <div>
          <p className={styles.menuDeckTitle}>{sectionTitle}</p>
          <p className={styles.menuDeckSubtitle}>{sectionSubtitle}</p>
        </div>
      </div>

      {showFloatingIndex && (
        <div className={styles.menuFloatingIndex}>
          <button
            type="button"
            className={`${styles.menuFloatingButton} ${
              isIndexOpen ? styles.menuFloatingButtonActive : ""
            }`}
            onClick={() => setIsIndexOpen((prev) => !prev)}
            aria-expanded={isIndexOpen}
            aria-controls="menu-index-panel"
            aria-label={indexTitle}
          >
            <span className={styles.menuFloatingIcon} aria-hidden="true">
              <span className={styles.menuFloatingLine} />
              <span className={styles.menuFloatingLine} />
              <span className={styles.menuFloatingLine} />
            </span>
          </button>
          <div
            id="menu-index-panel"
            className={`${styles.menuFloatingPanel} ${
              isIndexOpen ? styles.menuFloatingPanelOpen : ""
            }`}
            aria-hidden={!isIndexOpen}
          >
            <p className={styles.menuFloatingTitle}>{indexTitle}</p>
            <ul className={styles.menuIndexList}>
              {pages.map((page, index) => (
                <li
                  key={`${page.src}-floating`}
                  className={`${styles.menuIndexItem} ${
                    index === activeIndex ? styles.menuIndexItemActive : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.menuIndexButton}
                    onClick={() => handleIndexClick(index, true)}
                    aria-current={index === activeIndex ? "true" : undefined}
                    aria-label={page.label}
                  >
                    <span className={styles.menuIndexIcon} aria-hidden="true" />
                    <span className={styles.menuIndexNumber}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.menuIndexLabel}>{page.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default MenuShowcase;
