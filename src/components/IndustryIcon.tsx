import type { IndustryType } from "@/lib/games/brass-birmingham/types";

interface IndustryIconProps {
  industry: IndustryType;
  className?: string;
  size?: number;
}

/** Coal Mine — pickaxe / mining icon */
function CoalIcon({ size = 20 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 10l-1.5 1.5" />
      <path d="M17 7l-6 6" />
      <path d="M15 9l-6 6" />
      <path d="M3 21l6-6" />
      <circle cx="18" cy="6" r="3" />
    </svg>
  );
}

/** Iron Works — anvil / hammer icon */
function IronIcon({ size = 20 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21h10" />
      <path d="M10 21v-4" />
      <path d="M14 21v-4" />
      <rect x="5" y="13" width="14" height="4" rx="1" />
      <path d="M5 13c0-3 2-6 7-6s7 3 7 6" />
      <path d="M12 7V3" />
    </svg>
  );
}

/** Brewery — beer mug icon */
function BreweryIcon({ size = 20 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
      <path d="M5 8h12v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
      <path d="M8 4h2v4H8z" opacity="0.5" />
      <path d="M12 4h2v4h-2z" opacity="0.5" />
    </svg>
  );
}

/** Cotton Mill — thread spool icon */
function CottonIcon({ size = 20 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="8" ry="5" />
      <path d="M4 12v0c0 2.76 3.58 5 8 5s8-2.24 8-5" />
      <path d="M4 12c0-2.76 3.58-5 8-5s8 2.24 8 5" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="4.5" y1="10" x2="19.5" y2="14" />
      <line x1="4.5" y1="14" x2="19.5" y2="10" />
    </svg>
  );
}

/** Manufacturer — factory / gear icon */
function ManufacturerIcon({ size = 20 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M5 20V8l5 4V8l5 4V4h4a1 1 0 0 1 1 1v15" />
      <path d="M18 8h0" />
    </svg>
  );
}

/** Pottery — vase icon */
function PotteryIcon({ size = 20 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3c-1 3-2 5-2 8 0 2 .5 3 1.5 4.5S12 18 12 21" />
      <path d="M14 3c1 3 2 5 2 8 0 2-.5 3-1.5 4.5S12 18 12 21" />
      <path d="M7 11c0 0 2-1 5-1s5 1 5 1" />
      <path d="M8 21h8" />
    </svg>
  );
}

const ICON_MAP: Record<IndustryType, React.FC<{ size: number }>> = {
  coal: CoalIcon,
  iron: IronIcon,
  brewery: BreweryIcon,
  cotton: CottonIcon,
  manufacturer: ManufacturerIcon,
  pottery: PotteryIcon,
};

/** Color palette for each industry. */
export const INDUSTRY_COLORS: Record<IndustryType, string> = {
  coal: "text-stone-600",
  iron: "text-slate-600",
  brewery: "text-amber-600",
  cotton: "text-sky-600",
  manufacturer: "text-violet-600",
  pottery: "text-rose-600",
};

export const INDUSTRY_BG: Record<IndustryType, string> = {
  coal: "bg-stone-100",
  iron: "bg-slate-100",
  brewery: "bg-amber-50",
  cotton: "bg-sky-50",
  manufacturer: "bg-violet-50",
  pottery: "bg-rose-50",
};

export const INDUSTRY_BORDER: Record<IndustryType, string> = {
  coal: "border-stone-300",
  iron: "border-slate-300",
  brewery: "border-amber-300",
  cotton: "border-sky-300",
  manufacturer: "border-violet-300",
  pottery: "border-rose-300",
};

export function IndustryIcon({ industry, className = "", size = 20 }: IndustryIconProps) {
  const Icon = ICON_MAP[industry];
  return (
    <span className={`${INDUSTRY_COLORS[industry]} ${className}`}>
      <Icon size={size} />
    </span>
  );
}
