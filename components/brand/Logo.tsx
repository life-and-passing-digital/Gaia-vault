import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import beacon from "./gaia-logo-beacon.svg";

/**
 * The one Gaia logo — the beacon mark shared with gaiaapp.net (copied from
 * the website's assets/images/general/gaia_logo_beacon.svg). Gaia owns every
 * tool in the family, so products carry the same mark with the product name
 * alongside. `showWord` toggles the wordmark for tight spaces.
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
      <Image
        src={beacon}
        alt="Gaia"
        width={34}
        height={34}
        unoptimized
        priority
      />
      {showWord && (
        <span className="whitespace-nowrap font-display text-[1.35rem] leading-none text-forest-700">
          Gaia <span className="text-forest-500">Vault</span>
        </span>
      )}
    </span>
  );
}
