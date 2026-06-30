import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A vertical content band with generous whitespace and a centered, width-
 * constrained container. The backbone of the marketing and app layouts.
 */
export function Section({
  className,
  containerClassName,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { containerClassName?: string }) {
  return (
    <section className={cn("px-5 py-16 sm:py-20", className)} {...props}>
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Small eyebrow label above a heading. */
export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-[0.18em] text-sage-600",
        className,
      )}
      {...props}
    />
  );
}
