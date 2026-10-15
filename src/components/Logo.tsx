interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon ring - tech aesthetic */}
      <path
        d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Inner circuit lines */}
      <path
        d="M32 12 L48 21 L48 43 L32 52 L16 43 L16 21 Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        fill="none"
      />
      {/* Graduation cap */}
      <path
        d="M20 30 L32 24 L44 30 L32 36 Z"
        fill="currentColor"
      />
      {/* Cap tassel */}
      <path
        d="M44 30 L44 36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="44" cy="38" r="2" fill="currentColor" />
      {/* Cap base */}
      <path
        d="M24 33 L24 40 Q32 44 40 40 L40 33"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Circuit nodes */}
      <circle cx="16" cy="21" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="48" cy="21" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="16" cy="43" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="48" cy="43" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function LogoWithText({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} className="text-white" />
      <div className="leading-tight">
        <div className="text-white font-bold text-lg tracking-tight">Dhaanish Ahmed</div>
        <div className="text-white/60 text-xs font-medium tracking-wider uppercase">
          Institute of Technology
        </div>
      </div>
    </div>
  );
}
