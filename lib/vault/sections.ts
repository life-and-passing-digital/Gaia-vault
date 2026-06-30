import type { SectionType } from "@/lib/db/types";

/**
 * Section metadata — the order is the onboarding order, lowest-dread first:
 * wishes → people → documents → assets → messages. Copy is warm and plain.
 */
export interface SectionMeta {
  type: SectionType;
  label: string;
  blurb: string;
  prompt: string; // the gentle "what goes here" nudge
}

export const SECTIONS: SectionMeta[] = [
  {
    type: "wishes",
    label: "Wishes",
    blurb: "How you’d like to be cared for and remembered.",
    prompt: "Funeral preferences, the song, the readings, who to tell first.",
  },
  {
    type: "people",
    label: "People",
    blurb: "The people who matter, and how to reach them.",
    prompt: "Family, close friends, your doctor, your solicitor.",
  },
  {
    type: "documents",
    label: "Documents",
    blurb: "Where the important papers live.",
    prompt: "Will, insurance, property, identity documents.",
  },
  {
    type: "assets",
    label: "Assets & accounts",
    blurb: "What you hold and where it is.",
    prompt: "Bank, super, subscriptions, the things to wind down.",
  },
  {
    type: "messages",
    label: "Messages",
    blurb: "A few words for the people you love.",
    prompt: "Letters delivered gently, only when the time comes.",
  },
];

export const SECTION_BY_TYPE: Record<SectionType, SectionMeta> = Object.fromEntries(
  SECTIONS.map((s) => [s.type, s]),
) as Record<SectionType, SectionMeta>;

/** A gentle 0–100 completeness score from item counts per section. */
export function completeness(counts: Record<SectionType, number>): number {
  const touched = SECTIONS.filter((s) => (counts[s.type] ?? 0) > 0).length;
  return Math.round((touched / SECTIONS.length) * 100);
}
