"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingInputProps = {
  name: string;
  label?: string;
  defaultValue?: number | null;
  max?: number;
  step?: number;
};

export default function RatingInput({
  name,
  label = "Rating",
  defaultValue,
  max = 5,
  step = 0.5,
}: RatingInputProps) {
  const [rating, setRating] = React.useState<number | null>(() => {
    if (typeof defaultValue !== "number") return null;
    return Math.min(max, Math.max(0, defaultValue));
  });
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating ?? rating ?? 0;
  const handleSetRating = React.useCallback(
    (value: number) => {
      if (value < 0) {
        setRating(null);
        return;
      }
      const next = Math.min(max, Math.max(0, value));
      setRating(next);
    },
    [max]
  );

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div
        className="flex flex-wrap items-center gap-3"
        role="radiogroup"
        aria-label={label}
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: max }).map((_, index) => {
            const starIndex = index + 1;
            const fillPercent = Math.min(
              100,
              Math.max(0, (displayRating - (starIndex - 1)) * 100)
            );

            return (
              <div key={starIndex} className="relative h-7 w-7">
                <Star className="h-7 w-7 text-muted-foreground" />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
                </span>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 w-1/2"
                  onMouseEnter={() => setHoverRating(starIndex - 0.5)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleSetRating(starIndex - 0.5)}
                  aria-label={`Set rating to ${starIndex - 0.5}`}
                  aria-pressed={rating === starIndex - 0.5}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 w-1/2"
                  onMouseEnter={() => setHoverRating(starIndex)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleSetRating(starIndex)}
                  aria-label={`Set rating to ${starIndex}`}
                  aria-pressed={rating === starIndex}
                />
              </div>
            );
          })}
        </div>
        <div className="text-sm text-muted-foreground">
          {rating ? `${rating.toFixed(step === 1 ? 0 : 1)} / ${max}` : "No rating"}
        </div>
        <button
          type="button"
          className={cn(
            "rounded-md border px-2 py-1 text-xs font-medium transition",
            rating
              ? "border-border text-foreground hover:bg-muted"
              : "border-transparent text-muted-foreground"
          )}
          onClick={() => handleSetRating(-1)}
          disabled={!rating}
        >
          Clear
        </button>
      </div>
      <input
        type="hidden"
        name={name}
        value={rating ? String(rating) : ""}
      />
    </div>
  );
}
