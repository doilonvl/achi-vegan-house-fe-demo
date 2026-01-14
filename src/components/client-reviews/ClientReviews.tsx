"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import styles from "./ClientReviews.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ClientReviewContent = {
  review: string;
  clientName: string;
  clientCompany: string;
  rating?: number;
  avatar?: string;
  reviewImage?: string;
  reviewImages?: string[];
};

type ClientReview = ClientReviewContent & {
  backgroundColor: string;
  textColor: string;
  companyColor?: string;
  initials: string;
  ratingValue: number;
};

const reviewStyles: Array<
  Pick<ClientReview, "backgroundColor" | "textColor" | "companyColor">
> = [
  {
    backgroundColor: "#ccccc4",
    textColor: "#1a1614",
    companyColor: "#1a1614",
  },
  {
    backgroundColor: "#1a1614",
    textColor: "#e3e3db",
  },
  {
    backgroundColor: "#3d2fa9",
    textColor: "#e3e3db",
  },
  {
    backgroundColor: "#ccccc4",
    textColor: "#1a1614",
    companyColor: "#1a1614",
  },
  {
    backgroundColor: "#ff6e14",
    textColor: "#1a1614",
    companyColor: "#1a1614",
  },
  {
    backgroundColor: "#1a1614",
    textColor: "#e3e3db",
  },
];

const ClientReviews = () => {
  const clientReviewsContainerRef = useRef<HTMLDivElement | null>(null);
  const [activePhotos, setActivePhotos] = useState<Record<number, string>>({});
  const t = useTranslations("clientReviews");
  const clientReviewsData = useMemo<ClientReview[]>(() => {
    const items = t.raw("items") as ClientReviewContent[] | undefined;
    if (!Array.isArray(items)) return [];
    const getInitials = (name: string) =>
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
    return items.map((item, index) => ({
      ...item,
      ...reviewStyles[index % reviewStyles.length],
      initials: getInitials(item.clientName),
      ratingValue: Math.max(
        0,
        Math.min(
          5,
          Math.round(typeof item.rating === "number" ? item.rating : 5)
        )
      ),
    }));
  }, [t]);

  useGSAP(
    () => {
      const container = clientReviewsContainerRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1000px)", () => {
        const reviewCards = container.querySelectorAll<HTMLDivElement>(
          `.${styles.reviewCard}`
        );
        const cardContainers = container.querySelectorAll<HTMLDivElement>(
          `.${styles.reviewCardContainer}`
        );

        cardContainers.forEach((cardContainer, index) => {
          const rotation = index % 2 === 0 ? 3 : -3;
          gsap.set(cardContainer, { rotation });
        });

        const scrollTriggerInstances: ScrollTrigger[] = [];

        const delayed = gsap.delayedCall(0.1, () => {
          reviewCards.forEach((card, index) => {
            if (index < reviewCards.length - 1) {
              const trigger = ScrollTrigger.create({
                trigger: card,
                start: "top top",
                endTrigger: reviewCards[reviewCards.length - 1],
                end: "top top",
                pin: true,
                pinSpacing: false,
                scrub: 1,
              });
              scrollTriggerInstances.push(trigger);
            }

            if (index < reviewCards.length - 1) {
              const trigger = ScrollTrigger.create({
                trigger: reviewCards[index + 1],
                start: "top bottom",
                end: "top top",
              });
              scrollTriggerInstances.push(trigger);
            }
          });
        });

        const refreshHandler = () => ScrollTrigger.refresh();
        const onLoad = () => ScrollTrigger.refresh();

        window.addEventListener("orientationchange", refreshHandler);
        window.addEventListener("load", onLoad, { passive: true });

        return () => {
          delayed.kill();
          scrollTriggerInstances.forEach((trigger) => trigger.kill());
          window.removeEventListener("orientationchange", refreshHandler);
          window.removeEventListener("load", onLoad);
        };
      });

      mm.add("(max-width: 999px)", () => {
        const reviewCards = container.querySelectorAll<HTMLDivElement>(
          `.${styles.reviewCard}`
        );
        const cardContainers = container.querySelectorAll<HTMLDivElement>(
          `.${styles.reviewCardContainer}`
        );

        reviewCards.forEach((card) => {
          gsap.set(card, { clearProps: "all" });
        });
        cardContainers.forEach((cardContainer) => {
          gsap.set(cardContainer, { clearProps: "all" });
        });

        ScrollTrigger.refresh();

        const refreshHandler = () => ScrollTrigger.refresh();
        const onLoad = () => ScrollTrigger.refresh();

        window.addEventListener("orientationchange", refreshHandler);
        window.addEventListener("load", onLoad, { passive: true });

        return () => {
          window.removeEventListener("orientationchange", refreshHandler);
          window.removeEventListener("load", onLoad);
        };
      });

      return () => {
        mm.revert();
      };
    },
    { scope: clientReviewsContainerRef }
  );

  return (
    <div className={styles.clientReviews} ref={clientReviewsContainerRef}>
      {clientReviewsData.map((item, index) => {
        const images = Array.isArray(item.reviewImages)
          ? item.reviewImages
          : item.reviewImage
          ? [item.reviewImage]
          : [];
        const stack = images.slice(0, 3);
        const activeImage = activePhotos[index];
        const activeIndex = activeImage ? stack.indexOf(activeImage) : -1;
        const orderedStack =
          activeIndex > -1
            ? [
                stack[activeIndex],
                ...stack.slice(0, activeIndex),
                ...stack.slice(activeIndex + 1),
              ]
            : stack;

        return (
          <div className={styles.reviewCard} key={`${item.clientName}-${index}`}>
            <div
              className={styles.reviewCardContainer}
              style={{
                backgroundColor: item.backgroundColor,
                color: item.textColor,
              }}
            >
              <div className={styles.reviewCardContent}>
                <div className={styles.reviewCardContentWrapper}>
                  <div className={styles.reviewCardHeader}>
                    <div className={styles.reviewCardStars} aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <span
                          key={`${item.clientName}-star-${starIndex}`}
                          className={
                            starIndex < item.ratingValue
                              ? styles.reviewStar
                              : styles.reviewStarMuted
                          }
                        />
                      ))}
                    </div>
                    <div className={styles.reviewCardMeta}>
                      <div className={styles.reviewCardClientInfo}>
                        <div className={styles.reviewCardAvatar}>
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.clientName}
                              className={styles.reviewCardAvatarImage}
                            />
                          ) : (
                            <span className={styles.reviewCardAvatarFallback}>
                              {item.initials}
                            </span>
                          )}
                        </div>
                        <div className={styles.reviewCardClientDetails}>
                          <p className={styles.reviewCardClient}>
                            {item.clientName}
                          </p>
                          <p
                            className={styles.reviewCardClientCompany}
                            style={{
                              color: item.companyColor ?? "currentColor",
                            }}
                          >
                            {item.clientCompany}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.reviewCardBody}>
                    <div className={styles.reviewCardQuote}>
                      <p className={styles.reviewCardText}>{item.review}</p>
                      <div
                        className={styles.reviewCardDivider}
                        aria-hidden="true"
                      />
                    </div>
                    {stack.length > 0 ? (
                      <div className={styles.reviewCardMediaStack}>
                        {orderedStack.map((image, imageIndex) => (
                          <button
                            key={`${item.clientName}-${image}`}
                            type="button"
                            className={`${styles.reviewCardPhoto} ${
                              image === activeImage
                                ? styles.reviewCardPhotoActive
                                : ""
                            }`}
                            style={
                              {
                                "--stack-index": imageIndex,
                              } as CSSProperties
                            }
                            onClick={() =>
                              setActivePhotos((prev) => ({
                                ...prev,
                                [index]: image,
                              }))
                            }
                            aria-label={`Xem anh ${imageIndex + 1} cua ${
                              item.clientName
                            }`}
                            aria-pressed={image === activeImage}
                          >
                            <img
                              src={image}
                              alt={`${item.clientName} review ${
                                imageIndex + 1
                              }`}
                              className={styles.reviewCardPhotoImage}
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientReviews;
