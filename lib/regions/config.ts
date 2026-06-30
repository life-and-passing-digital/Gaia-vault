// ─────────────────────────────────────────────────────────────────────────────
// Data residency configuration.
//
// RESIDENCY: v1 ships a single AU region. The region is *config, not code*: each
// region maps to its own Supabase project (database + storage in that locale).
// Adding UK/EU/US later means adding an entry here and provisioning the project —
// no feature-code refactor. See /docs/DATA-RESIDENCY.md.
// ─────────────────────────────────────────────────────────────────────────────

export type RegionCode = "au" | "uk" | "eu" | "us";

export interface RegionConfig {
  code: RegionCode;
  label: string;
  /** Supabase/Vercel deployment locale, for documentation & provisioning. */
  storageLocale: string;
  /** Whether this region is live in the current deployment. */
  enabled: boolean;
}

export const REGIONS: Record<RegionCode, RegionConfig> = {
  au: { code: "au", label: "Australia", storageLocale: "ap-southeast-2", enabled: true },
  // The following are architected-for but NOT provisioned in v1.
  uk: { code: "uk", label: "United Kingdom", storageLocale: "eu-west-2", enabled: false },
  eu: { code: "eu", label: "European Union", storageLocale: "eu-central-1", enabled: false },
  us: { code: "us", label: "United States", storageLocale: "us-east-1", enabled: false },
};

export const DEFAULT_REGION: RegionCode = "au";

/** The region this running instance serves (from env, defaulting to AU). */
export function activeRegion(): RegionConfig {
  const code = (process.env.NEXT_PUBLIC_REGION ?? DEFAULT_REGION) as RegionCode;
  const region = REGIONS[code];
  if (!region || !region.enabled) {
    // Fail loud in dev; never silently serve the wrong residency.
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Region "${code}" is not enabled in this deployment.`);
    }
    return REGIONS[DEFAULT_REGION];
  }
  return region;
}

export function isRegionCode(value: string): value is RegionCode {
  return value in REGIONS;
}
