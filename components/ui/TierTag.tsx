import { cn } from "@/lib/utils/cn";
import { RELEASE_TIERS, type ReleaseTier } from "@/lib/vault/tiers";

const toneClasses: Record<string, string> = {
  sage: "bg-sage-100 text-sage-700 border-sage-200",
  flame: "bg-flame-300/30 text-flame-600 border-flame-300/60",
  forest: "bg-forest-100 text-forest-800 border-forest-200",
};

/**
 * A small pill that labels which release tier a vault item belongs to.
 * The colour and words come straight from lib/vault/tiers so they can never
 * disagree with the rule the backend enforces.
 */
export function TierTag({ tier, className }: { tier: ReleaseTier; className?: string }) {
  const t = RELEASE_TIERS[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[t.tone],
        className,
      )}
      title={t.description}
    >
      {t.short}
    </span>
  );
}
