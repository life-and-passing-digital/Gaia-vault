import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-pill " +
  "transition-colors duration-150 focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none " +
  "select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest-700 text-canvas-50 hover:bg-forest-800 focus-visible:outline-forest-500",
  secondary:
    "bg-sage-100 text-forest-800 hover:bg-sage-200 focus-visible:outline-forest-500",
  ghost:
    "bg-transparent text-forest-700 hover:bg-sage-100 focus-visible:outline-forest-500",
  danger:
    "bg-[var(--color-danger)] text-canvas-50 hover:opacity-90 focus-visible:outline-[var(--color-danger)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base py-3",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * The primary interactive control. Pill-shaped and soft, matching the Gaia
 * family. Always renders a real <button> so keyboard and screen-reader
 * behaviour is correct for free.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);
