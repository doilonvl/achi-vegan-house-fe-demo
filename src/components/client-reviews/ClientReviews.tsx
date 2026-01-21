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

type ClientReviewsProps = {
  items?: ClientReviewContent[];
};

const reviewStyles: Array<
  Pick<ClientReview, "backgroundColor" | "textColor" | "companyColor">
> = [
  {
    backgroundColor: "#e6e2d6",
    textColor: "#1a2e1a",
    companyColor: "#36512f",
  },
  {
    backgroundColor: "#ded8cb",
    textColor: "#1a2e1a",
  },
  {
    backgroundColor: "#d9d2c4",
    textColor: "#1a2e1a",
  },
  {
    backgroundColor: "#e1dccf",
    textColor: "#1a2e1a",
    companyColor: "#3b5a35",
  },
  {
    backgroundColor: "#e8e3d8",
    textColor: "#1a2e1a",
  },
  {
    backgroundColor: "#dcd5c7",
    textColor: "#1a2e1a",
  },
];

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Achi+Vegan+House+(Nh%C3%A0+Chay+Achi)/@21.0412605,105.8246087,17z/data=!4m8!3m7!1s0x3135ab57746b2723:0xdb0bd2bed69a7797!8m2!3d21.0412605!4d105.8271836!9m1!1b1!16s%2Fg%2F11gdkq04km?entry=ttu&g_ep=EgoyMDI2MDExMy4wIKXMDSoASAFQAw%3D%3D";

const ClientReviews = ({ items }: ClientReviewsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useTranslations("clientReviews");
  const clientReviewsData = useMemo<ClientReview[]>(() => {
    const fallbackItems = t.raw("items") as ClientReviewContent[] | undefined;
    const sourceItems = items?.length ? items : fallbackItems;
    if (!Array.isArray(sourceItems)) return [];
    const getInitials = (name: string) => {
      const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
      return initials || "?";
    };
    return sourceItems.map((item, index) => ({
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
  }, [items, t]);

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
        <p className={styles.reviewEyebrow}>{t("eyebrow")}</p>
        <h2 className={styles.reviewTitle}>{t("title")}</h2>
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
                <p
                  className={styles.reviewCardText}
                  onWheel={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                >
                  {item.review}
                </p>
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
                  <a
                    className={styles.reviewCardLink}
                    href={GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    View on Google
                  </a>
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
          {t("prev")}
        </button>
        <button
          type="button"
          className={styles.reviewControlButton}
          onClick={() => shiftActive(1)}
          aria-label="Next review"
        >
          {t("next")}
        </button>
      </div>
    </section>
  );
};

export default ClientReviews;
