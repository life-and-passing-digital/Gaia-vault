// Feature flags for GATED capabilities. Each defaults OFF and must stay off
// until the sign-offs in /docs/LEGAL-GATES.md are complete. Read on the server.

const on = (v: string | undefined) => v === "true" || v === "1";

export const FLAGS = {
  // LEGAL-GATE: financial credentials require GLBA + computer-misuse legal opinion.
  credentials: on(process.env.FEATURE_CREDENTIALS),
  // LEGAL-GATE: cross-product data sharing needs consent + DPA review.
  crmSync: on(process.env.FEATURE_CRM_SYNC),
  // LEGAL-GATE: death-database signals are corroboration only, never a trigger.
  deathDbChecks: on(process.env.FEATURE_DEATH_DB_CHECKS),
} as const;
