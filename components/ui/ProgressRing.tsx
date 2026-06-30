import * as React from "react";

export interface ProgressRingProps {
  /** Completion 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Optional label shown in the centre; defaults to the percentage. */
  label?: React.ReactNode;
}

/**
 * The "peace-of-mind" completion indicator used through onboarding and the
 * dashboard. Calm sage track, forest progress arc. Accessible via role+aria.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Vault completeness"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-sage-200)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-forest-600)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-display text-lg text-forest-800">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
