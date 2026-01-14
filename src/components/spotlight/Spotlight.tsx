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
        const textItems = spotlightElement.querySelectorAll<HTMLHeadingElement>(
          `.${styles.marqueeTextItem} h1`
        );

        textItems.forEach((heading) => {
          splitInstances.push(new SplitType(heading, { types: "chars" }));
        });

        spotlightElement
          .querySelectorAll(`.${styles.marqueeContainer}`)
          .forEach((container, index) => {
            const marquee = container.querySelector(`.${styles.marquee}`);
            const chars = container.querySelectorAll(".char");

            if (!marquee) return;

            const marqueeTrigger = gsap.to(marquee, {
              x: index % 2 === 0 ? "5%" : "-15%",
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
        <div className={styles.marqueeContainer} id="marquee-1">
          <div className={styles.marquee}>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-1.jpg" alt="" />
            </div>
            <div
              className={`${styles.marqueeImgItem} ${styles.marqueeTextItem}`}
            >
              <h1>{getMarqueeText(0, "Plant-based")}</h1>
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-2.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-3.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-4.jpg" alt="" />
            </div>
          </div>
        </div>

        <div className={styles.marqueeContainer} id="marquee-2">
          <div className={styles.marquee}>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-5.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-6.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-7.jpg" alt="" />
            </div>
            <div
              className={`${styles.marqueeImgItem} ${styles.marqueeTextItem}`}
            >
              <h1>{getMarqueeText(1, "Fresh")}</h1>
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-8.jpg" alt="" />
            </div>
          </div>
        </div>

        <div className={styles.marqueeContainer} id="marquee-3">
          <div className={styles.marquee}>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-9.jpg" alt="" />
            </div>
            <div
              className={`${styles.marqueeImgItem} ${styles.marqueeTextItem}`}
            >
              <h1>{getMarqueeText(2, "Organic")}</h1>
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-10.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-11.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-12.jpg" alt="" />
            </div>
          </div>
        </div>

        <div className={styles.marqueeContainer} id="marquee-4">
          <div className={styles.marquee}>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-13.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-14.jpg" alt="" />
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-15.jpg" alt="" />
            </div>
            <div
              className={`${styles.marqueeImgItem} ${styles.marqueeTextItem}`}
            >
              <h1>{getMarqueeText(3, "Thoughtful")}</h1>
            </div>
            <div className={styles.marqueeImgItem}>
              <img src="/spotlight/spotlight-16.jpg" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Spotlight;
