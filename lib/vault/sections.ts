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
  /** Starter ideas shown as one-tap chips in the editor. */
  suggestions: string[];
  /** Encouragement shown once the section has at least one item. */
  encouragement: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    type: "wishes",
    label: "Wishes",
    blurb: "How you’d like to be cared for and remembered.",
    prompt: "Funeral preferences, the song, the readings, who to tell first.",
    suggestions: [
      "My funeral preferences",
      "Music and readings",
      "Burial or cremation",
      "Who to tell first",
      "Flowers, donations and dress",
    ],
    encouragement: "Your wishes are taking shape. Add as much or as little as feels right.",
  },
  {
    type: "people",
    label: "People",
    blurb: "The people who matter, and how to reach them.",
    prompt: "Family, close friends, your doctor, your solicitor.",
    suggestions: [
      "My doctor",
      "My solicitor",
      "Closest friends to contact",
      "My accountant",
      "Neighbours who hold a key",
    ],
    encouragement: "The right people, easy to find when it matters.",
  },
  {
    type: "documents",
    label: "Documents",
    blurb: "Where the important papers live.",
    prompt: "Will, insurance, property, identity documents.",
    suggestions: [
      "Where my will is kept",
      "Life insurance policy",
      "Property and mortgage papers",
      "Passport and identity documents",
      "Power of attorney",
    ],
    encouragement: "No hunting through drawers. Everything points to the right place.",
  },
  {
    type: "assets",
    label: "Assets & accounts",
    blurb: "What you hold and where it is.",
    prompt: "Bank, super, subscriptions, the things to wind down.",
    suggestions: [
      "Everyday bank accounts",
      "Superannuation",
      "Subscriptions to cancel",
      "Loyalty programs and points",
      "Digital accounts and domains",
    ],
    encouragement: "A clear map of what you hold, so nothing is lost or forgotten.",
  },
  {
    type: "messages",
    label: "Messages",
    blurb: "A few words for the people you love.",
    prompt: "Letters delivered gently, only when the time comes.",
    suggestions: [
      "A letter to my partner",
      "For my children, when they’re ready",
      "To my best friend",
      "Something for a future birthday",
    ],
    encouragement: "Words they’ll keep. Delivered gently, only when the time comes.",
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
