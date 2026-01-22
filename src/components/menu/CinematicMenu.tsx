"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./CinematicMenu.module.css";

type MenuItem = {
  label: string;
  image: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type MenuItemWithIndex = MenuItem & {
  globalIndex: number;
};

type MenuSectionWithIndex = {
  title: string;
  items: MenuItemWithIndex[];
};

type CinematicMenuProps = {
  eyebrow: string;
  title: string;
  tagline: string;
  hintTitle: string;
  hintBody: string;
  closeLabel: string;
  sections: MenuSection[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const CinematicMenu = ({
  eyebrow,
  title,
  tagline,
  hintTitle,
  hintBody,
  closeLabel,
  sections,
}: CinematicMenuProps) => {
  const [activeItem, setActiveItem] = useState<MenuItemWithIndex | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1200, height: 800 });

  const sectionsWithIndex = useMemo<MenuSectionWithIndex[]>(() => {
    return sections.reduce<MenuSectionWithIndex[]>((acc, section) => {
      const offset = acc.reduce((sum, group) => sum + group.items.length, 0);
      const items = section.items.map((item, index) => ({
        ...item,
        globalIndex: offset + index,
      }));
      acc.push({ ...section, items });
      return acc;
    }, []);
  }, [sections]);

  const isCompact = viewport.width < 900;

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const previewPosition = useMemo(() => {
    if (isCompact) {
      return {
        x: viewport.width * 0.5,
        y: Math.min(viewport.height * 0.45, viewport.height - 220),
      };
    }
    const padding = 220;
    return {
      x: clamp(pointer.x, padding, viewport.width - padding),
      y: clamp(pointer.y, padding, viewport.height - padding),
    };
  }, [isCompact, pointer, viewport]);

  const allItems = useMemo(
    () => sectionsWithIndex.flatMap((section) => section.items),
    [sectionsWithIndex],
  );
  const selectedItem = selectedIndex !== null ? allItems[selectedIndex] : null;

  const shiftSelected = (direction: number) => {
    if (selectedIndex === null || allItems.length === 0) return;
    setSelectedIndex(
      (selectedIndex + direction + allItems.length) % allItems.length,
    );
  };

  return (
    <section
      className={styles.menuRoot}
      onMouseMove={(event) =>
        setPointer({ x: event.clientX, y: event.clientY })
      }
      onMouseLeave={() => setActiveItem(null)}
    >
      <header className={styles.menuHero}>
        <p className={styles.menuEyebrow}>{eyebrow}</p>
        <h1 className={styles.menuTitle}>{title}</h1>
        <p className={styles.menuTagline}>
          {tagline}
          {isCompact ? (
            <span className={styles.menuTaglineHint}>
              ({hintTitle}. {hintBody})
            </span>
          ) : null}
        </p>
      </header>

      <div className={styles.menuHintWrap} aria-hidden="true">
        <div className={styles.menuHintArc}>
          <svg viewBox="0 0 220 120">
            <path
              d="M10 110 C70 10, 150 10, 210 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
            <path
              d="M198 64 L210 70 L198 76"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.menuHintText}>
          <span>{hintTitle}</span>
          <span>{hintBody}</span>
        </div>
      </div>

      <div className={styles.menuList}>
        {sectionsWithIndex.map((section) => (
          <div className={styles.menuSection} key={section.title}>
            <h2 className={styles.menuSectionTitle}>{section.title}</h2>
            <ul className={styles.menuItems}>
              {section.items.map((item) => {
                const isActive = activeItem?.label === item.label;
                return (
                  <li className={styles.menuItem} key={item.globalIndex}>
                    <button
                      type="button"
                      className={`${styles.menuItemButton} ${
                        isActive ? styles.menuItemButtonActive : ""
                      }`}
                      onMouseEnter={() => {
                        if (!isCompact) setActiveItem(item);
                      }}
                      onPointerDown={(event) => {
                        if (!isCompact && event.pointerType !== "mouse") {
                          setActiveItem(item);
                          setPointer({ x: event.clientX, y: event.clientY });
                        }
                      }}
                      onClick={() => {
                        setSelectedIndex(item.globalIndex);
                      }}
                      onFocus={() => {
                        if (!isCompact) setActiveItem(item);
                      }}
                      onBlur={() => {
                        if (!isCompact) setActiveItem(null);
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!isCompact && activeItem ? (
          <motion.div
            key={activeItem.label}
            className={styles.menuPreview}
            style={{
              left: previewPosition.x,
              top: previewPosition.y,
            }}
            initial={{ opacity: 0, scale: 0.92, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <motion.img
              src={activeItem.image}
              alt={activeItem.label}
              className={styles.menuPreviewImage}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem ? (
          <motion.div
            className={styles.menuModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            {(() => {
              const safeIndex = selectedIndex ?? 0;
              const prevIndex =
                (safeIndex - 1 + allItems.length) % allItems.length;
              const nextIndex = (safeIndex + 1) % allItems.length;
              return (
                <motion.div
                  className={styles.menuModalCard}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={(event) => event.stopPropagation()}
                >
              <button
                type="button"
                className={styles.menuModalClose}
                onClick={() => setSelectedIndex(null)}
                aria-label="Close"
              >
                {closeLabel}
              </button>
                  <button
                    type="button"
                    className={`${styles.menuModalNav} ${styles.menuModalNavLeft}`}
                    onClick={() => shiftSelected(-1)}
                    aria-label="Previous menu image"
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.menuModalNav} ${styles.menuModalNavRight}`}
                    onClick={() => shiftSelected(1)}
                    aria-label="Next menu image"
                  >
                    {">"}
                  </button>
                  <div className={styles.menuModalStrip}>
                    {allItems.length > 1 ? (
                      <img
                        src={allItems[prevIndex].image}
                        alt=""
                        className={styles.menuModalThumb}
                        onClick={() => shiftSelected(-1)}
                      />
                    ) : null}
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.label}
                      className={styles.menuModalMain}
                    />
                    {allItems.length > 1 ? (
                      <img
                        src={allItems[nextIndex].image}
                        alt=""
                        className={styles.menuModalThumb}
                        onClick={() => shiftSelected(1)}
                      />
                    ) : null}
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default CinematicMenu;

