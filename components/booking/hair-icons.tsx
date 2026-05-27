// SVG silhouettes for 6 hair profiles (straight × [short/medium/long], wavy × [short/medium/long])

export type HairType = "STRAIGHT" | "WAVY_CURLY";
export type HairLength = "SHORT" | "MEDIUM" | "LONG";

interface IconProps {
  className?: string;
}

// ─── Straight / Liso ──────────────────────────────────────────────────────────

export function StraightShortIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 76" fill="none" className={className}>
      {/* Hair — jaw-length bob */}
      <path
        d="M18 16 Q18 6 32 6 Q46 6 46 16 L46 54 Q46 57 43 57 L21 57 Q18 57 18 54 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Face */}
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#F5D0A9" />
      {/* Neck */}
      <rect x="28" y="39" width="8" height="6" rx="3" fill="#F5D0A9" />
    </svg>
  );
}

export function StraightMediumIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 76" fill="none" className={className}>
      {/* Hair — shoulder-length */}
      <path
        d="M16 16 Q16 5 32 5 Q48 5 48 16 L48 64 Q48 67 45 67 L19 67 Q16 67 16 64 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Face */}
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#F5D0A9" />
      <rect x="28" y="39" width="8" height="6" rx="3" fill="#F5D0A9" />
    </svg>
  );
}

export function StraightLongIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 84" fill="none" className={className}>
      {/* Hair — long, chest-length */}
      <path
        d="M14 16 Q14 5 32 5 Q50 5 50 16 L50 78 Q50 81 47 81 L17 81 Q14 81 14 78 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Face */}
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#F5D0A9" />
      <rect x="28" y="39" width="8" height="6" rx="3" fill="#F5D0A9" />
    </svg>
  );
}

// ─── Wavy / Ondulado ──────────────────────────────────────────────────────────

export function WavyShortIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 76" fill="none" className={className}>
      {/* Hair — short with volume and waves, ends at chin */}
      <path
        d="M14 16 Q14 5 32 5 Q50 5 50 16
           C 56 22 56 30 52 34
           C 56 38 54 44 50 48
           Q 46 54 32 56
           Q 18 54 14 48
           C 10 44 8 38 12 34
           C 8 30 8 22 14 16 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Face */}
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#F5D0A9" />
      <rect x="28" y="39" width="8" height="6" rx="3" fill="#F5D0A9" />
    </svg>
  );
}

export function WavyMediumIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 76" fill="none" className={className}>
      {/* Hair — medium wavy, shoulder-length with S-curves */}
      <path
        d="M12 16 Q12 4 32 4 Q52 4 52 16
           C 58 24 56 34 54 40
           C 58 46 56 54 52 60
           Q 48 66 32 68
           Q 16 66 12 60
           C 8 54 6 46 10 40
           C 8 34 6 24 12 16 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Face */}
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#F5D0A9" />
      <rect x="28" y="39" width="8" height="6" rx="3" fill="#F5D0A9" />
    </svg>
  );
}

export function WavyLongIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 84" fill="none" className={className}>
      {/* Hair — long wavy, three S-curves */}
      <path
        d="M10 16 Q10 4 32 4 Q54 4 54 16
           C 60 24 58 36 56 42
           C 60 50 58 60 56 66
           C 60 72 56 80 52 82
           Q 32 86 12 82
           C 8 80 4 72 8 66
           C 6 60 4 50 8 42
           C 6 36 4 24 10 16 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Face */}
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#F5D0A9" />
      <rect x="28" y="39" width="8" height="6" rx="3" fill="#F5D0A9" />
    </svg>
  );
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

export const HAIR_ICONS: Record<HairType, Record<HairLength, React.FC<IconProps>>> = {
  STRAIGHT: {
    SHORT:  StraightShortIcon,
    MEDIUM: StraightMediumIcon,
    LONG:   StraightLongIcon,
  },
  WAVY_CURLY: {
    SHORT:  WavyShortIcon,
    MEDIUM: WavyMediumIcon,
    LONG:   WavyLongIcon,
  },
};

export const HAIR_TYPE_LABEL: Record<HairType, string> = {
  STRAIGHT:   "Liso",
  WAVY_CURLY: "Ondulado / Cacheado",
};

export const HAIR_LENGTH_LABEL: Record<HairLength, string> = {
  SHORT:  "Curto",
  MEDIUM: "Médio",
  LONG:   "Longo",
};
