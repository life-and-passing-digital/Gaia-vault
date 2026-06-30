import * as React from "react";
import { cn } from "@/lib/utils/cn";

const controlBase =
  "w-full rounded-2xl border border-canvas-400 bg-canvas-50 px-4 py-2.5 text-ink-900 " +
  "placeholder:text-ink-300 transition-colors focus:border-forest-500 " +
  "focus-visible:outline-none focus:ring-2 focus:ring-forest-500/25";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlBase, className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlBase, "min-h-28 resize-y", className)}
      {...props}
    />
  );
});

/**
 * Labelled form field wrapper. Wires up the label, optional hint and error to
 * the control via aria attributes so screen-reader users get the full context —
 * important everywhere, critical in the bereavement flows.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-ink-400">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
