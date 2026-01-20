"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./Showreel.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const TOTAL_FRAMES = 4;
const FRAME_INTERVAL_MS = 1500;
const DEFAULT_VOLUME = 0.2;

const Showreel = () => {
  const showreelSecRef = useRef<HTMLElement | null>(null);
  const showreelContainerRef = useRef<HTMLDivElement | null>(null);
  const showreelImageRef = useRef<HTMLImageElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subheadRef = useRef<HTMLParagraphElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const t = useTranslations("home");

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = DEFAULT_VOLUME;
    }
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);

    if (!audio.muted && audio.paused) {
      audio.play();
    }
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const headline = headlineRef.current;
      const subhead = subheadRef.current;

      if (headline) {
        const words = headline.querySelectorAll("span");
        gsap.fromTo(
          words,
          { yPercent: 130, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 1.2,
            ease: "power4.out",
          }
        );
      }

      if (subhead) {
        gsap.fromTo(
          subhead,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.4 }
        );
      }

      mm.add("(min-width: 1000px)", () => {
        const scrollTriggerInstances: ScrollTrigger[] = [];
        const frameTimeline = gsap.timeline({ repeat: -1 });

        for (let i = 1; i <= TOTAL_FRAMES; i += 1) {
          frameTimeline.add(() => {
            setCurrentFrame(i);
          }, (i - 1) * (FRAME_INTERVAL_MS / 1000));
        }

        audioRef.current?.play().catch(() => {});

        const scrollTrigger = ScrollTrigger.create({
          trigger: showreelSecRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 2}px`,
          pin: true,
          pinSpacing: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const scaleValue = gsap.utils.mapRange(0, 1, 0.75, 1, progress);
            const borderRadiusValue =
              progress <= 0.5 ? gsap.utils.mapRange(0, 0.5, 2, 0, progress) : 0;

            if (showreelContainerRef.current) {
              gsap.set(showreelContainerRef.current, {
                scale: scaleValue,
                borderRadius: `${borderRadiusValue}rem`,
              });
            }
          },
        });

        scrollTriggerInstances.push(scrollTrigger);

        if (showreelImageRef.current) {
          const parallax = gsap.to(showreelImageRef.current, {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: showreelSecRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
          scrollTriggerInstances.push(parallax.scrollTrigger as ScrollTrigger);
        }

        const refreshHandler = () => ScrollTrigger.refresh();
        const onLoad = () => ScrollTrigger.refresh();

        window.addEventListener("orientationchange", refreshHandler);
        window.addEventListener("resize", refreshHandler);
        window.addEventListener("load", onLoad, { passive: true });

        return () => {
          frameTimeline.kill();
          scrollTriggerInstances.forEach((trigger) => trigger.kill());
          window.removeEventListener("orientationchange", refreshHandler);
          window.removeEventListener("resize", refreshHandler);
          window.removeEventListener("load", onLoad);
        };
      });

      mm.add("(max-width: 999px)", () => {
        const showreelSection = showreelSecRef.current;
        if (showreelSection) {
          gsap.set(showreelSection, { clearProps: "all" });
        }
        if (showreelContainerRef.current) {
          gsap.set(showreelContainerRef.current, { clearProps: "all" });
        }

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
    { scope: showreelSecRef }
  );

  return (
    <section className={styles.showreel} ref={showreelSecRef}>
      <div className={styles.showreelContainer} ref={showreelContainerRef}>
        <img
          ref={showreelImageRef}
          src={`/Ingredient/i${currentFrame}.png`}
          alt="Showreel frame"
        />
        <div className={styles.showreelGlow} aria-hidden="true" />
      </div>

      <div className={styles.showreelCopy}>
        <h1 className={styles.showreelHeadline} ref={headlineRef}>
          <span>ACHI</span>
          <span>VEGAN</span>
          <span>HOUSE</span>
        </h1>
        <p className={styles.showreelSubhead} ref={subheadRef}>
          {t("heroSubhead")}
        </p>
      </div>

      <button
        type="button"
        className={styles.volumeIcon}
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute showreel" : "Mute showreel"}
      >
        {isMuted ? (
          <VolumeX color="#171412" size={25} />
        ) : (
          <Volume2 color="#171412" size={25} />
        )}
      </button>

      <audio
        ref={audioRef}
        src="/Combo/showreel_music.mp3"
        loop
        muted={isMuted}
      />
    </section>
  );
};

export default Showreel;
