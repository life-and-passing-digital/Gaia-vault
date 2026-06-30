import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A warm, encouraging empty state. Used wherever a section has nothing yet —
 * tone is "let's gently begin," never "you've failed to fill this in."
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center rounded-card border border-dashed " +
          "border-sage-300 bg-sage-50/60 px-6 py-12",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-forest-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-display text-forest-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
