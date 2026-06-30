import { cn } from "@/lib/utils/cn";

/**
 * Trust signal shown beside encrypted content. Honest by design: the label is
 * configurable so we never imply zero-knowledge where the release set is not
 * (see /docs/SECURITY.md). Default copy is deliberately modest.
 */
export function SecureBadge({
  label = "Encrypted",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-forest-50 px-2.5 py-1 " +
          "text-xs font-medium text-forest-700",
        className,
      )}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M6 10V8a6 6 0 1 1 12 0v2m-13 0h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
