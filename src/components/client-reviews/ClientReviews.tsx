"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import styles from "./ClientReviews.module.css";

type ClientReviewContent = {
  review: string;
  clientName: string;
  clientCompany: string;
  rating?: number;
  avatar?: string;
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
    backgroundColor: "#0f3d2e",
    textColor: "#f9f7f0",
    companyColor: "#e6ddc4",
  },
  {
    backgroundColor: "#0a2a4a",
    textColor: "#f5f7ff",
  },
  {
    backgroundColor: "#3b0f2d",
    textColor: "#fef6f0",
  },
  {
    backgroundColor: "#10463f",
    textColor: "#f6f3e8",
    companyColor: "#f6f3e8",
  },
  {
    backgroundColor: "#1c3c68",
    textColor: "#f5f7ff",
  },
  {
    backgroundColor: "#4a1230",
    textColor: "#fdf3f6",
  },
];

const ClientReviews = () => {
  const [activeIndex, setActiveIndex] = useState(0);
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

  const totalReviews = clientReviewsData.length;

  const shiftActive = (direction: number) => {
    setActiveIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return totalReviews - 1;
      if (next >= totalReviews) return 0;
      return next;
    });
  };

  return (
    <section className={styles.clientReviews}>
      <div className={styles.reviewHeader}>
        <p className={styles.reviewEyebrow}>Voices</p>
        <h2 className={styles.reviewTitle}>Testimonials in 3D</h2>
      </div>
      <div className={styles.reviewCarousel} role="region" aria-label="Reviews">
        {clientReviewsData.map((item, index) => {
          const offset = index - activeIndex;
          const limitedOffset = Math.max(-2, Math.min(2, offset));
          return (
            <button
              key={`${item.clientName}-${index}`}
              type="button"
              className={styles.reviewCard}
              onClick={() => setActiveIndex(index)}
              aria-pressed={index === activeIndex}
              style={
                {
                  backgroundColor: item.backgroundColor,
                  color: item.textColor,
                  "--offset": limitedOffset,
                  "--abs-offset": Math.abs(limitedOffset),
                  zIndex: 10 - Math.abs(limitedOffset),
                } as CSSProperties
              }
            >
              <div className={styles.reviewCardInner}>
                <span className={styles.reviewWatermark} aria-hidden="true">
                  &ldquo;
                </span>
                <p className={styles.reviewCardText}>{item.review}</p>
                <div className={styles.reviewCardDivider} aria-hidden="true" />
                <div className={styles.reviewCardFooter}>
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
            </button>
          );
        })}
      </div>
      <div className={styles.reviewControls}>
        <button
          type="button"
          className={styles.reviewControlButton}
          onClick={() => shiftActive(-1)}
          aria-label="Previous review"
        >
          Prev
        </button>
        <button
          type="button"
          className={styles.reviewControlButton}
          onClick={() => shiftActive(1)}
          aria-label="Next review"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default ClientReviews;
