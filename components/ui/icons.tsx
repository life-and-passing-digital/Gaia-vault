import * as React from "react";

/**
 * Tiny inline icon set, stroke-based and sized via props. All icons inherit
 * currentColor so they recolour with text utilities. Decorative by default
 * (aria-hidden); pass a label only when the icon stands alone.
 */
export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
  label?: string;
}

function Base({
  size = 20,
  label,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHeart = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20.5s-7.5-4.7-9.4-9.2C1.2 8 3.2 4.9 6.4 4.9c2 0 3.6 1.1 4.5 2.7l1.1 1.9 1.1-1.9c.9-1.6 2.5-2.7 4.5-2.7 3.2 0 5.2 3.1 3.8 6.4-1.9 4.5-9.4 9.2-9.4 9.2Z" />
  </Base>
);

export const IconUsers = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" />
    <circle cx="17" cy="9.5" r="2.4" />
    <path d="M15.8 14.7c2.4.1 4.2 1.6 4.7 4" />
  </Base>
);

export const IconFile = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5Z" />
    <path d="M14 3.5V8h4.5M9 12.5h6M9 16h6" />
  </Base>
);

export const IconBank = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 9.5 12 4l8.5 5.5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 20h17" />
  </Base>
);

export const IconMail = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </Base>
);

export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-2.5Z" />
    <path d="m9 11.7 2.2 2.2 3.8-4" />
  </Base>
);

export const IconLock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" />
  </Base>
);

export const IconSparkle = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.8 6.8l2 2M15.2 15.2l2 2M17.2 6.8l-2 2M8.8 15.2l-2 2" />
  </Base>
);

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12h15M14 6.5l5.5 5.5-5.5 5.5" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const IconLeafSmall = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 5c-8 0-13 4-13 10 0 2 .8 3.6 2 4.5C9.5 15 13 11 19 5Z" />
    <path d="M6.5 19.5C10 14 13.5 10.5 19 5" />
  </Base>
);

export const IconHome = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 11 8-7 8 7M6 9.5V20h12V9.5" />
  </Base>
);

export const IconVault = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 10v2l1.4 1.4" />
  </Base>
);
