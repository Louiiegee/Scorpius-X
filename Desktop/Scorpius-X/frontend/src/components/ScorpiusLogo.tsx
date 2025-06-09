interface ScorpiusLogoProps {
  className?: string;
  size?: number;
}

export const ScorpiusLogo = ({
  className = "",
  size = 32,
}: ScorpiusLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      {/* Shield Background */}
      <path
        d="M50 5 L75 15 L85 40 L85 65 L75 85 L50 95 L25 85 L15 65 L15 40 L25 15 Z"
        fill="url(#shieldGradient)"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Circuit Pattern */}
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.6">
        <path d="M30 25 L70 25 M30 35 L70 35 M30 45 L70 45" />
        <circle cx="25" cy="25" r="2" fill="currentColor" />
        <circle cx="75" cy="25" r="2" fill="currentColor" />
        <circle cx="25" cy="35" r="2" fill="currentColor" />
        <circle cx="75" cy="35" r="2" fill="currentColor" />
      </g>

      {/* Cyber Scorpion Body */}
      <ellipse
        cx="50"
        cy="55"
        rx="18"
        ry="12"
        fill="url(#bodyGradient)"
        stroke="currentColor"
        strokeWidth="1"
      />

      {/* Scorpion Head */}
      <ellipse
        cx="50"
        cy="45"
        rx="8"
        ry="6"
        fill="url(#headGradient)"
        stroke="currentColor"
        strokeWidth="0.8"
      />

      {/* Eyes */}
      <circle cx="47" cy="43" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="53" cy="43" r="1.5" fill="currentColor" opacity="0.9" />

      {/* Pincers */}
      <path
        d="M35 48 Q30 45 28 50 Q32 52 35 50 Z"
        fill="url(#pincerGradient)"
        stroke="currentColor"
        strokeWidth="0.6"
      />
      <path
        d="M65 48 Q70 45 72 50 Q68 52 65 50 Z"
        fill="url(#pincerGradient)"
        stroke="currentColor"
        strokeWidth="0.6"
      />

      {/* Legs */}
      <g stroke="currentColor" strokeWidth="1.2" fill="none">
        <path d="M38 52 L25 58 M42 55 L30 65 M58 55 L70 65 M62 52 L75 58" />
        <path d="M38 58 L25 65 M42 60 L30 70 M58 60 L70 70 M62 58 L75 65" />
      </g>

      {/* Cyber Tail with Segments */}
      <g stroke="currentColor" strokeWidth="1.5" fill="url(#tailGradient)">
        <ellipse cx="50" cy="68" rx="3" ry="4" />
        <ellipse cx="52" cy="75" rx="2.5" ry="3" />
        <ellipse cx="55" cy="82" rx="2" ry="2.5" />
        <ellipse cx="58" cy="88" rx="1.5" ry="2" />
      </g>

      {/* Tech Patterns on Body */}
      <g stroke="currentColor" strokeWidth="0.4" opacity="0.7">
        <path d="M42 52 L58 52 M45 57 L55 57 M47 62 L53 62" />
        <circle cx="50" cy="55" r="6" fill="none" strokeDasharray="2,2" />
      </g>

      {/* Stinger */}
      <path
        d="M58 88 L62 92 L60 94 L58 90 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />

      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 255, 170, 0.15)" />
          <stop offset="50%" stopColor="rgba(0, 212, 170, 0.05)" />
          <stop offset="100%" stopColor="rgba(0, 167, 136, 0.15)" />
        </linearGradient>

        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 255, 170, 0.3)" />
          <stop offset="50%" stopColor="rgba(0, 212, 170, 0.2)" />
          <stop offset="100%" stopColor="rgba(0, 167, 136, 0.3)" />
        </linearGradient>

        <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 255, 170, 0.4)" />
          <stop offset="100%" stopColor="rgba(0, 212, 170, 0.2)" />
        </linearGradient>

        <linearGradient id="pincerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 255, 170, 0.35)" />
          <stop offset="100%" stopColor="rgba(0, 167, 136, 0.25)" />
        </linearGradient>

        <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 255, 170, 0.25)" />
          <stop offset="100%" stopColor="rgba(0, 212, 170, 0.35)" />
        </linearGradient>
      </defs>
    </svg>
  );
};
