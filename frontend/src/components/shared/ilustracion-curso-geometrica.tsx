import { cn } from "@/lib/utils";

interface IlustracionCursoGeometricaProps {
  variant?: "compact" | "hero";
  className?: string;
}

export function IlustracionCursoGeometrica({
  variant = "hero",
  className,
}: IlustracionCursoGeometricaProps) {
  if (variant === "compact") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 120 72"
        className={cn("pointer-events-none h-14 w-auto shrink-0 md:h-16", className)}
        fill="none"
      >
        <polygon
          points="18,58 42,12 78,18 96,52 54,66"
          stroke="rgba(83,230,220,0.55)"
          strokeWidth="1.2"
          fill="rgba(45,212,191,0.08)"
        />
        <line x1="42" y1="12" x2="78" y2="18" stroke="rgba(157,104,255,0.45)" strokeWidth="1" />
        <line x1="78" y1="18" x2="96" y2="52" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
        <line x1="18" y1="58" x2="54" y2="66" stroke="rgba(83,230,220,0.35)" strokeWidth="1" />
        <circle cx="42" cy="12" r="2.5" fill="rgba(83,230,220,0.85)" />
        <circle cx="78" cy="18" r="2" fill="rgba(157,104,255,0.8)" />
        <circle cx="96" cy="52" r="2" fill="rgba(56,189,248,0.75)" />
        <path
          d="M58 34 L68 34 M63 29 L63 39"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 420 360"
      className={cn(
        "pointer-events-none absolute right-0 top-1/2 z-20 w-[min(72vw,300px)] -translate-y-1/2 opacity-30 sm:w-[min(58vw,360px)] sm:opacity-45 md:w-[min(46vw,420px)] md:opacity-70 lg:w-[min(40vw,480px)] lg:opacity-85",
        className,
      )}
      fill="none"
    >
      <polygon
        points="210,40 330,95 360,220 250,310 90,270 60,140"
        stroke="rgba(83,230,220,0.35)"
        strokeWidth="1.5"
        fill="rgba(45,212,191,0.06)"
      />
      <polygon
        points="250,110 340,150 320,240 210,260 170,180"
        stroke="rgba(157,104,255,0.32)"
        strokeWidth="1.2"
        fill="rgba(157,104,255,0.05)"
      />
      <line x1="210" y1="40" x2="330" y2="95" stroke="rgba(83,230,220,0.28)" strokeWidth="1" />
      <line x1="330" y1="95" x2="360" y2="220" stroke="rgba(56,189,248,0.25)" strokeWidth="1" />
      <line x1="360" y1="220" x2="250" y2="310" stroke="rgba(157,104,255,0.22)" strokeWidth="1" />
      <line x1="250" y1="310" x2="90" y2="270" stroke="rgba(83,230,220,0.2)" strokeWidth="1" />
      <line x1="90" y1="270" x2="60" y2="140" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
      <line x1="60" y1="140" x2="210" y2="40" stroke="rgba(157,104,255,0.2)" strokeWidth="1" />
      <line x1="250" y1="110" x2="340" y2="150" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      <line x1="210" y1="260" x2="170" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
      <circle cx="210" cy="40" r="4" fill="rgba(83,230,220,0.9)" />
      <circle cx="330" cy="95" r="3.5" fill="rgba(157,104,255,0.85)" />
      <circle cx="360" cy="220" r="3" fill="rgba(56,189,248,0.8)" />
      <circle cx="250" cy="310" r="3.5" fill="rgba(83,230,220,0.75)" />
      <circle cx="250" cy="110" r="2.5" fill="rgba(255,255,255,0.5)" />
      <path
        d="M300 175 L315 190 L300 205 L285 190 Z"
        stroke="rgba(83,230,220,0.4)"
        strokeWidth="1"
        fill="rgba(45,212,191,0.08)"
      />
      <path
        d="M130 200 L155 215 L140 240 L115 225 Z"
        stroke="rgba(157,104,255,0.35)"
        strokeWidth="1"
        fill="rgba(157,104,255,0.06)"
      />
    </svg>
  );
}
