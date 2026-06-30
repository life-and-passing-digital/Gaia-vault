import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Soft, rounded surface with gentle elevation — the workhorse container.
 * Set `interactive` for hover lift on clickable cards.
 */
export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card bg-canvas-50 border border-canvas-300/70 shadow-soft p-6",
        interactive &&
          "transition-shadow duration-200 hover:shadow-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-display text-forest-800", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-ink-500 leading-relaxed", className)} {...props} />
  );
}
