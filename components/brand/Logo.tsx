import { cn } from "@/lib/utils/cn";

/**
 * Gaia Vault wordmark + mark. The mark is a leaf cradling a flame — the Gaia
 * family motif — rendered in a single accessible SVG. `showWord` toggles the
 * "Gaia Vault" wordmark for tight spaces (favicons, mobile headers).
 */
export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="Gaia Vault"
      >
        {/* leaf */}
        <path
          d="M16 3C9 6 5 11 5 17c0 6 4.5 11 11 12 6.5-1 11-6 11-12 0-6-4-11-11-14Z"
          fill="var(--color-sage-200)"
        />
        <path
          d="M16 5.5C16 12 16 22 16 28"
          stroke="var(--color-forest-600)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* flame */}
        <path
          d="M16 12c2.4 1.8 3.6 3.7 3.6 5.7A3.6 3.6 0 0 1 16 21.3a3.6 3.6 0 0 1-3.6-3.6c0-2 1.2-3.9 3.6-5.7Z"
          fill="var(--color-flame-500)"
        />
      </svg>
      {showWord && (
        <span className="whitespace-nowrap font-display text-[1.35rem] leading-none text-forest-800">
          Gaia <span className="text-forest-600">Vault</span>
        </span>
      )}
    </span>
  );
}
