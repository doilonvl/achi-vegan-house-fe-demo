"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SplitType from "split-type";
import { useTranslations } from "next-intl";
import styles from "./Spotlight.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Spotlight = () => {
  const spotlightRef = useRef<HTMLElement | null>(null);
  const t = useTranslations("spotlight");
  const marqueeTexts = useMemo(() => {
    const items = t.raw("marqueeTexts") as string[] | undefined;
    return Array.isArray(items) ? items : [];
  }, [t]);

  const getMarqueeText = (index: number, fallback: string) =>
    marqueeTexts[index] ?? fallback;

  const marqueeDescriptions = useMemo(() => {
    const items = t.raw("marqueeDescriptions") as string[] | undefined;
    return Array.isArray(items) ? items : [];
  }, [t]);

  const getMarqueeDescription = (index: number, fallback: string) =>
    marqueeDescriptions[index] ?? fallback;

  const marqueeRows = useMemo(
    () => [
      {
        id: "marquee-1",
        word: getMarqueeText(0, "Plant-based"),
        description: getMarqueeDescription(
          0,
          "Bright, crunchy produce with a fresh-picked bite."
        ),
        images: [
          "/spotlight/spotlight-1.jpg",
          "/spotlight/spotlight-2.jpg",
          "/spotlight/spotlight-3.jpg",
          "/spotlight/spotlight-4.jpg",
        ],
      },
      {
        id: "marquee-2",
        word: getMarqueeText(1, "Fresh"),
        description: getMarqueeDescription(
          1,
          "Herbs and vegetables that pop with natural color."
        ),
        images: [
          "/spotlight/spotlight-5.jpg",
          "/spotlight/spotlight-6.jpg",
          "/spotlight/spotlight-7.jpg",
          "/spotlight/spotlight-8.jpg",
        ],
      },
      {
        id: "marquee-3",
        word: getMarqueeText(2, "Organic"),
        description: getMarqueeDescription(
          2,
          "Deep earth notes, slow-grown ingredients, bold aroma."
        ),
        images: [
          "/spotlight/spotlight-9.jpg",
          "/spotlight/spotlight-10.jpg",
          "/spotlight/spotlight-11.jpg",
          "/spotlight/spotlight-12.jpg",
        ],
      },
      {
        id: "marquee-4",
        word: getMarqueeText(3, "Thoughtful"),
        description: getMarqueeDescription(
          3,
          "Layered textures, careful seasoning, unforgettable finish."
        ),
        images: [
          "/spotlight/spotlight-13.jpg",
          "/spotlight/spotlight-14.jpg",
          "/spotlight/spotlight-15.jpg",
          "/spotlight/spotlight-16.jpg",
        ],
      },
    ],
    [getMarqueeDescription, getMarqueeText]
  );
  const getWordSizing = (word: string) => {
    const normalizedLength = word.replace(/\s+/g, "").length;
    if (normalizedLength >= 9) {
      return {
        maskFontSize: 210,
        maskLetterSpacing: -6,
        maskTextLength: 1040,
        titleFontSize: "clamp(2.2rem, 6.8vw, 5.2rem)",
        titleLetterSpacing: "-0.02em",
      };
    }
    if (normalizedLength >= 7) {
      return {
        maskFontSize: 230,
        maskLetterSpacing: -8,
        maskTextLength: 1100,
        titleFontSize: "clamp(2.4rem, 7.4vw, 5.6rem)",
        titleLetterSpacing: "-0.03em",
      };
    }
    return {
      maskFontSize: 260,
      maskLetterSpacing: -10,
      maskTextLength: undefined,
      titleFontSize: undefined,
      titleLetterSpacing: undefined,
    };
  };

  useGSAP(
    () => {
      const spotlightElement = spotlightRef.current;
      if (!spotlightElement) return;

      const scrollTriggers: ScrollTrigger[] = [];
      const animations: gsap.core.Animation[] = [];
      const splitInstances: SplitType[] = [];
      let waitTimeout: ReturnType<typeof setTimeout> | null = null;
      let initTimeout: ReturnType<typeof setTimeout> | null = null;

      const initSpotlight = () => {
        spotlightElement
          .querySelectorAll(`.${styles.marqueeContainer}`)
          .forEach((container, index) => {
            const marquee = container.querySelector(`.${styles.marquee}`);
            const word = container.querySelector(
              `.${styles.marqueeMaskedWord}`
            );
            const mediaItems = container.querySelectorAll(
              `.${styles.marqueeMedia}`
            );

            if (word) {
              splitInstances.push(
                new SplitType(word as HTMLElement, { types: "chars" })
              );
            }
            const chars = container.querySelectorAll(".char");

            if (!marquee) return;

            const marqueeTrigger = gsap.to(marquee, {
              x: index % 2 === 0 ? "12%" : "-18%",
              scrollTrigger: {
                trigger: container,
                start: "top bottom",
                end: "150% top",
                scrub: true,
              },
              force3D: true,
            });

            const charsTrigger = gsap.fromTo(
              chars,
              { fontWeight: 100 },
              {
                fontWeight: 900,
                duration: 1,
                ease: "none",
                stagger: {
                  each: 0.35,
                  from: index % 2 === 0 ? "end" : "start",
                  ease: "linear",
                },
                scrollTrigger: {
                  trigger: container,
                  start: "50% bottom",
                  end: "top top",
                  scrub: true,
                },
              }
            );

            animations.push(marqueeTrigger, charsTrigger);

            if (marqueeTrigger.scrollTrigger) {
              scrollTriggers.push(marqueeTrigger.scrollTrigger);
            }
            if (charsTrigger.scrollTrigger) {
              scrollTriggers.push(charsTrigger.scrollTrigger);
            }

            mediaItems.forEach((item) => {
              const scaleTrigger = gsap.fromTo(
                item,
                { scale: 1 },
                {
                  scale: 1.1,
                  ease: "none",
                  scrollTrigger: {
                    trigger: item,
                    start: "center bottom",
                    end: "center top",
                    scrub: true,
                  },
                }
              );
              animations.push(scaleTrigger);
              if (scaleTrigger.scrollTrigger) {
                scrollTriggers.push(scaleTrigger.scrollTrigger);
              }
            });
          });

        ScrollTrigger.refresh();
      };

      const waitForOtherTriggers = () => {
        const existingTriggers = ScrollTrigger.getAll();
        const hasPinnedTrigger = existingTriggers.some(
          (trigger) => trigger.vars && trigger.vars.pin
        );

        if (hasPinnedTrigger || existingTriggers.length > 0) {
          initTimeout = setTimeout(initSpotlight, 300);
        } else {
          initSpotlight();
        }
      };

      waitTimeout = setTimeout(waitForOtherTriggers, 100);

      return () => {
        if (waitTimeout) clearTimeout(waitTimeout);
        if (initTimeout) clearTimeout(initTimeout);
        scrollTriggers.forEach((trigger) => trigger.kill());
        animations.forEach((animation) => animation.kill());
        splitInstances.forEach((instance) => instance.revert());
      };
    },
    { scope: spotlightRef }
  );

  return (
    <section className={styles.spotlight} ref={spotlightRef}>
      <div className={styles.marquees}>
        {marqueeRows.map((row, rowIndex) => (
          <div className={styles.marqueeContainer} id={row.id} key={row.id}>
            <div className={styles.marquee}>
              {row.images.map((src, index) => {
                const isMasked = index === 1;
                const maskId = `spotlight-mask-${rowIndex}-${index}`;
                const wordSizing = getWordSizing(row.word);
                const maskTextProps = wordSizing.maskTextLength
                  ? {
                      textLength: wordSizing.maskTextLength,
                      lengthAdjust: "spacingAndGlyphs" as const,
                    }
                  : {};
                return (
                  <figure
                    className={`${styles.marqueeItem} ${
                      isMasked ? styles.marqueeItemMasked : ""
                    }`}
                    key={`${row.id}-${src}`}
                  >
                    <div className={styles.marqueeMedia}>
                      {isMasked ? (
                        <svg
                          className={styles.marqueeMaskSvg}
                          viewBox="0 0 1200 800"
                          role="img"
                          aria-label={row.word}
                        >
                          <defs>
                            <mask id={maskId}>
                              <rect
                                x="0"
                                y="0"
                                width="1200"
                                height="800"
                                fill="white"
                              />
                              <text
                                x="50%"
                                y="54%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontFamily="var(--font-playfair), Playfair Display, serif"
                                fontSize={wordSizing.maskFontSize}
                                fontWeight="900"
                                letterSpacing={wordSizing.maskLetterSpacing}
                                fill="black"
                                {...maskTextProps}
                              >
                                {row.word}
                              </text>
                            </mask>
                          </defs>
                          <image
                            href={src}
                            width="1200"
                            height="800"
                            preserveAspectRatio="xMidYMid slice"
                            mask={`url(#${maskId})`}
                          />
                        </svg>
                      ) : (
                        <img src={src} alt="" />
                      )}
                    </div>
                    {isMasked ? (
                      <h1
                        className={styles.marqueeMaskedWord}
                        style={{
                          fontSize: wordSizing.titleFontSize,
                          letterSpacing: wordSizing.titleLetterSpacing,
                        }}
                      >
                        {row.word}
                      </h1>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Spotlight;
