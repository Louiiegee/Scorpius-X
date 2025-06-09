interface UserLogoProps {
  className?: string;
  size?: number;
}

export const UserLogo = ({ className = "", size = 32 }: UserLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      style={{
        filter: "drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))",
      }}
    >
      {/* Outer Hexagonal Shield Border */}
      <path
        d="M50 5 L78 18 L88 45 L78 72 L50 85 L22 72 L12 45 L22 18 Z"
        fill="url(#outerShield)"
        stroke="#bbb"
        strokeWidth="1.5"
      />

      {/* Middle Shield Frame */}
      <path
        d="M50 9 L74 20 L82 43 L74 66 L50 77 L26 66 L18 43 L26 20 Z"
        fill="url(#middleShield)"
        stroke="#999"
        strokeWidth="1.2"
      />

      {/* Inner Shield Core */}
      <path
        d="M50 13 L70 22 L76 41 L70 60 L50 69 L30 60 L24 41 L30 22 Z"
        fill="url(#innerShield)"
        stroke="#777"
        strokeWidth="1"
      />

      {/* Circuit Board Pattern on Shield */}
      <g stroke="#999" strokeWidth="0.7" opacity="0.9">
        <path d="M25 28 L75 28 M25 32 L75 32 M28 36 L72 36" />
        <path d="M30 22 L30 38 M35 20 L35 40 M65 20 L65 40 M70 22 L70 38" />
        <circle cx="22" cy="28" r="1.5" fill="#ccc" />
        <circle cx="78" cy="28" r="1.5" fill="#ccc" />
        <circle cx="22" cy="36" r="1.5" fill="#ccc" />
        <circle cx="78" cy="36" r="1.5" fill="#ccc" />

        {/* Additional circuit details */}
        <path d="M28 24 L72 24 M32 40 L68 40" />
        <rect x="26" y="26" width="3" height="2" fill="#aaa" />
        <rect x="71" y="26" width="3" height="2" fill="#aaa" />
      </g>

      {/* Scorpion Head with Segmented Armor */}
      <g fill="url(#headGradient)" stroke="#333" strokeWidth="1.2">
        <ellipse cx="50" cy="35" rx="10" ry="7" />
        <path d="M42 32 L58 32 L56 38 L44 38 Z" />
        <path d="M44 30 L56 30 L54 34 L46 34 Z" />
        <path d="M46 28 L54 28 L52 31 L48 31 Z" />
      </g>

      {/* Glowing Cyan Eyes */}
      <circle cx="46" cy="34" r="2.5" fill="#00ffff" opacity="0.9" />
      <circle cx="54" cy="34" r="2.5" fill="#00ffff" opacity="0.9" />
      <circle cx="46" cy="34" r="1.5" fill="#ffffff" />
      <circle cx="54" cy="34" r="1.5" fill="#ffffff" />
      <circle cx="46" cy="34" r="0.8" fill="#00ffff" />
      <circle cx="54" cy="34" r="0.8" fill="#00ffff" />

      {/* Massive Armored Claws */}
      <g fill="url(#clawGradient)" stroke="#222" strokeWidth="1.2">
        {/* Left Claw System */}
        <path d="M28 38 Q15 30 8 42 Q15 48 28 42 L33 40 Z" />
        <path d="M20 40 L10 46 Q8 49 12 47 L20 44" />
        <path d="M15 42 L5 48 Q3 51 8 49 L15 46" />
        <path d="M25 36 L18 32 Q16 30 20 32 L25 35" />

        {/* Right Claw System */}
        <path d="M72 38 Q85 30 92 42 Q85 48 72 42 L67 40 Z" />
        <path d="M80 40 L90 46 Q92 49 88 47 L80 44" />
        <path d="M85 42 L95 48 Q97 51 92 49 L85 46" />
        <path d="M75 36 L82 32 Q84 30 80 32 L75 35" />
      </g>

      {/* Heavily Armored Segmented Body */}
      <g fill="url(#bodyGradient)" stroke="#333" strokeWidth="1.2">
        <ellipse cx="50" cy="43" rx="15" ry="8" />
        <ellipse cx="50" cy="50" rx="17" ry="9" />
        <ellipse cx="50" cy="57" rx="15" ry="8" />
        <ellipse cx="50" cy="63" rx="13" ry="7" />
      </g>

      {/* Detailed Armor Plating */}
      <g stroke="#555" strokeWidth="0.9" opacity="0.9">
        <path d="M36 46 L64 46 M38 52 L62 52 M40 58 L60 58" />
        <path d="M35 43 L35 60 M65 43 L65 60" />
        <path d="M40 41 L60 41 M40 65 L60 65" />

        {/* Hexagonal armor patterns */}
        <polygon points="45,48 47,46 53,46 55,48 53,50 47,50" fill="none" />
        <polygon points="44,54 46,52 54,52 56,54 54,56 46,56" fill="none" />

        {/* Mechanical joints and rivets */}
        <circle cx="38" cy="46" r="1.2" fill="#777" />
        <circle cx="62" cy="46" r="1.2" fill="#777" />
        <circle cx="40" cy="58" r="1.2" fill="#777" />
        <circle cx="60" cy="58" r="1.2" fill="#777" />
      </g>

      {/* Eight Articulated Mechanical Legs */}
      <g stroke="#444" strokeWidth="2" fill="none" opacity="0.9">
        {/* Left side legs */}
        <path d="M35 46 L15 54 M37 52 L17 63 M39 58 L19 69 M41 62 L21 73" />
        {/* Right side legs */}
        <path d="M65 46 L85 54 M63 52 L83 63 M61 58 L81 69 M59 62 L79 73" />

        {/* Leg segments and articulated joints */}
        <circle cx="17" cy="58" r="1.5" fill="#666" />
        <circle cx="21" cy="66" r="1.5" fill="#666" />
        <circle cx="83" cy="58" r="1.5" fill="#666" />
        <circle cx="79" cy="66" r="1.5" fill="#666" />

        {/* Leg armor plating */}
        <path d="M35 46 L25 50 L15 54 M37 52 L27 58 L17 63" />
        <path d="M65 46 L75 50 L85 54 M63 52 L73 58 L83 63" />
      </g>

      {/* Articulated Tail Curving Dramatically Upward */}
      <g fill="url(#tailGradient)" stroke="#222" strokeWidth="1.3">
        <ellipse cx="50" cy="68" rx="4.5" ry="6" />
        <ellipse cx="54" cy="74" rx="4" ry="5.5" />
        <ellipse cx="59" cy="79" rx="3.5" ry="5" />
        <ellipse cx="65" cy="82" rx="3.2" ry="4.5" />
        <ellipse cx="71" cy="84" rx="3" ry="4" />
        <ellipse cx="77" cy="85" rx="2.8" ry="3.5" />
        <ellipse cx="82" cy="83" rx="2.5" ry="3" />
        <ellipse cx="86" cy="79" rx="2.2" ry="2.8" />
        <ellipse cx="88" cy="74" rx="2" ry="2.5" />
      </g>

      {/* Tail Segment Armor Details */}
      <g stroke="#444" strokeWidth="0.9" opacity="0.8">
        <path d="M48 66 L52 70 M52 72 L56 76 M57 77 L61 81 M63 80 L67 84 M69 82 L73 86 M75 83 L79 87 M80 81 L84 85 M84 77 L87 81" />

        {/* Segment separators */}
        <path d="M46 68 L54 68 M50 74 L58 74 M55 79 L63 79 M61 82 L69 82" />
      </g>

      {/* Lethal Stinger with Venom Drop */}
      <g fill="#ff3333" stroke="#cc0000" strokeWidth="1.2">
        <path d="M88 74 L95 68 L97 72 L92 76 Z" />
        <path d="M93 70 L98 66 L99 69 L95 73 Z" />
        <circle cx="96" cy="70" r="1.2" fill="#ff6666" />

        {/* Venom drop */}
        <ellipse
          cx="97"
          cy="68"
          rx="0.8"
          ry="1.2"
          fill="#ff9999"
          opacity="0.7"
        />
      </g>

      {/* Central Mechanical Core Pattern */}
      <g stroke="#777" strokeWidth="0.7" opacity="0.85">
        <circle cx="50" cy="52" r="12" fill="none" strokeDasharray="3,1" />
        <circle cx="50" cy="52" r="8" fill="none" strokeDasharray="2,1" />
        <circle cx="50" cy="52" r="4" fill="none" strokeDasharray="1,1" />

        {/* Cross pattern */}
        <path d="M46 48 L54 56 M54 48 L46 56" />
        <path d="M50 44 L50 60 M42 52 L58 52" />

        {/* Central core */}
        <circle cx="50" cy="52" r="2" fill="url(#coreGradient)" />
      </g>

      <defs>
        <linearGradient id="outerShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="30%" stopColor="#333" />
          <stop offset="70%" stopColor="#222" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>

        <linearGradient id="middleShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#444" />
          <stop offset="50%" stopColor="#282828" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        <linearGradient id="innerShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#333" />
          <stop offset="50%" stopColor="#222" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>

        <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#777" />
          <stop offset="50%" stopColor="#444" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>

        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#666" />
          <stop offset="30%" stopColor="#444" />
          <stop offset="70%" stopColor="#333" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>

        <linearGradient id="clawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="50%" stopColor="#555" />
          <stop offset="100%" stopColor="#333" />
        </linearGradient>

        <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#666" />
          <stop offset="50%" stopColor="#444" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>

        <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ffff" />
          <stop offset="50%" stopColor="#0088cc" />
          <stop offset="100%" stopColor="#004488" />
        </radialGradient>
      </defs>
    </svg>
  );
};
