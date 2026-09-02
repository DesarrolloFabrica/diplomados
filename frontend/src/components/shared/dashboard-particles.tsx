"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type DashboardParticlesProps = {
  preset?: string;
  accent?: string;
};

type ParticleDepth = "far" | "mid" | "near";
type ParticleMotion = "a" | "b" | "c";
type ParticleVisibility = "mobile" | "tablet" | "desktop";

type DashboardParticle = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  depth: ParticleDepth;
  motion: ParticleMotion;
  visibility: ParticleVisibility;
  color?: string;
};

const DASHBOARD_PARTICLES: DashboardParticle[] = [
  { x: 8, y: 84, size: 3, delay: 0.4, duration: 12, driftX: 14, driftY: -52, depth: "mid", motion: "a", visibility: "mobile", color: "#83E6D4" },
  { x: 14, y: 72, size: 2, delay: 2.1, duration: 16, driftX: -10, driftY: -34, depth: "far", motion: "b", visibility: "mobile", color: "#74CFC4" },
  { x: 20, y: 88, size: 5, delay: 1.3, duration: 10, driftX: 18, driftY: -46, depth: "near", motion: "a", visibility: "mobile", color: "#91DC00" },
  { x: 31, y: 79, size: 2, delay: 3.2, duration: 18, driftX: 8, driftY: -30, depth: "far", motion: "c", visibility: "mobile", color: "#70D8C8" },
  { x: 42, y: 86, size: 4, delay: 0.9, duration: 13, driftX: -16, driftY: -42, depth: "mid", motion: "b", visibility: "mobile", color: "#58E4F7" },
  { x: 56, y: 76, size: 3, delay: 4.4, duration: 15, driftX: 12, driftY: -38, depth: "mid", motion: "a", visibility: "mobile", color: "#83E6D4" },
  { x: 68, y: 83, size: 6, delay: 2.7, duration: 11, driftX: -12, driftY: -50, depth: "near", motion: "b", visibility: "mobile", color: "#77F2E4" },
  { x: 82, y: 70, size: 3, delay: 1.8, duration: 14, driftX: 10, driftY: -36, depth: "mid", motion: "a", visibility: "mobile", color: "#9BF3D8" },
  { x: 91, y: 84, size: 4, delay: 5.1, duration: 12, driftX: -18, driftY: -44, depth: "near", motion: "b", visibility: "mobile", color: "#EACB72" },
  { x: 96, y: 58, size: 2, delay: 3.8, duration: 17, driftX: -8, driftY: -26, depth: "far", motion: "c", visibility: "mobile", color: "#85D7E5" },
  { x: 4, y: 76, size: 2, delay: 6.1, duration: 15, driftX: 10, driftY: -36, depth: "mid", motion: "a", visibility: "mobile", color: "#77F2E4" },
  { x: 27, y: 92, size: 3, delay: 3.7, duration: 12, driftX: -12, driftY: -42, depth: "mid", motion: "b", visibility: "mobile", color: "#91DC00" },
  { x: 74, y: 88, size: 5, delay: 4.8, duration: 10, driftX: 14, driftY: -40, depth: "near", motion: "a", visibility: "mobile", color: "#83E6D4" },
  { x: 98, y: 74, size: 3, delay: 1.9, duration: 14, driftX: -16, driftY: -34, depth: "mid", motion: "b", visibility: "mobile", color: "#70D8C8" },
  { x: 73, y: 54, size: 2, delay: 0.2, duration: 18, driftX: 10, driftY: -28, depth: "far", motion: "c", visibility: "tablet", color: "#74CFC4" },
  { x: 87, y: 45, size: 3, delay: 2.6, duration: 13, driftX: -14, driftY: -34, depth: "mid", motion: "b", visibility: "tablet", color: "#83E6D4" },
  { x: 78, y: 63, size: 5, delay: 1.5, duration: 10, driftX: 12, driftY: -40, depth: "near", motion: "a", visibility: "tablet", color: "#91DC00" },
  { x: 63, y: 66, size: 2, delay: 4.9, duration: 16, driftX: -8, driftY: -32, depth: "far", motion: "b", visibility: "tablet", color: "#58E4F7" },
  { x: 36, y: 71, size: 3, delay: 6.2, duration: 14, driftX: 15, driftY: -37, depth: "mid", motion: "a", visibility: "tablet", color: "#70D8C8" },
  { x: 24, y: 62, size: 2, delay: 5.5, duration: 17, driftX: -10, driftY: -24, depth: "far", motion: "c", visibility: "tablet", color: "#B6A4FF" },
  { x: 7, y: 54, size: 4, delay: 4.1, duration: 12, driftX: 12, driftY: -34, depth: "mid", motion: "a", visibility: "tablet", color: "#9BF3D8" },
  { x: 93, y: 34, size: 2, delay: 7.4, duration: 18, driftX: -12, driftY: -22, depth: "far", motion: "c", visibility: "tablet", color: "#85D7E5" },
  { x: 11, y: 66, size: 3, delay: 8.3, duration: 13, driftX: 12, driftY: -30, depth: "mid", motion: "a", visibility: "tablet", color: "#77F2E4" },
  { x: 33, y: 86, size: 5, delay: 2.4, duration: 11, driftX: -14, driftY: -44, depth: "near", motion: "b", visibility: "tablet", color: "#83E6D4" },
  { x: 46, y: 73, size: 2, delay: 9.1, duration: 18, driftX: 8, driftY: -26, depth: "far", motion: "c", visibility: "tablet", color: "#74CFC4" },
  { x: 58, y: 88, size: 4, delay: 6.9, duration: 12, driftX: 16, driftY: -36, depth: "mid", motion: "a", visibility: "tablet", color: "#91DC00" },
  { x: 81, y: 57, size: 2, delay: 3.4, duration: 17, driftX: -10, driftY: -28, depth: "far", motion: "c", visibility: "tablet", color: "#58E4F7" },
  { x: 97, y: 46, size: 4, delay: 5.6, duration: 12, driftX: -18, driftY: -32, depth: "mid", motion: "b", visibility: "tablet", color: "#EACB72" },
  { x: 88, y: 78, size: 6, delay: 0.7, duration: 9, driftX: -18, driftY: -44, depth: "near", motion: "b", visibility: "desktop", color: "#77F2E4" },
  { x: 95, y: 72, size: 3, delay: 2.9, duration: 13, driftX: -10, driftY: -36, depth: "mid", motion: "a", visibility: "desktop", color: "#91DC00" },
  { x: 84, y: 89, size: 2, delay: 6.8, duration: 16, driftX: 8, driftY: -26, depth: "far", motion: "c", visibility: "desktop", color: "#74CFC4" },
  { x: 70, y: 91, size: 4, delay: 3.5, duration: 11, driftX: -16, driftY: -42, depth: "near", motion: "b", visibility: "desktop", color: "#83E6D4" },
  { x: 51, y: 91, size: 2, delay: 8.2, duration: 18, driftX: 10, driftY: -30, depth: "far", motion: "c", visibility: "desktop", color: "#58E4F7" },
  { x: 40, y: 58, size: 2, delay: 2.2, duration: 17, driftX: -8, driftY: -24, depth: "far", motion: "c", visibility: "desktop", color: "#85D7E5" },
  { x: 48, y: 50, size: 3, delay: 5.8, duration: 15, driftX: 12, driftY: -34, depth: "mid", motion: "a", visibility: "desktop", color: "#77F2E4" },
  { x: 59, y: 47, size: 2, delay: 7.1, duration: 18, driftX: -10, driftY: -22, depth: "far", motion: "c", visibility: "desktop", color: "#74CFC4" },
  { x: 66, y: 42, size: 4, delay: 4.6, duration: 13, driftX: 14, driftY: -34, depth: "mid", motion: "a", visibility: "desktop", color: "#9BF3D8" },
  { x: 76, y: 38, size: 3, delay: 1.1, duration: 14, driftX: -12, driftY: -32, depth: "mid", motion: "b", visibility: "desktop", color: "#58E4F7" },
  { x: 89, y: 25, size: 2, delay: 6.4, duration: 18, driftX: 8, driftY: -22, depth: "far", motion: "c", visibility: "desktop", color: "#EACB72" },
  { x: 17, y: 45, size: 2, delay: 7.8, duration: 16, driftX: -8, driftY: -24, depth: "far", motion: "c", visibility: "desktop", color: "#83E6D4" },
  { x: 6, y: 91, size: 5, delay: 3.1, duration: 10, driftX: 15, driftY: -38, depth: "near", motion: "a", visibility: "desktop", color: "#91DC00" },
  { x: 12, y: 58, size: 3, delay: 9.3, duration: 14, driftX: -10, driftY: -30, depth: "mid", motion: "b", visibility: "desktop", color: "#70D8C8" },
  { x: 28, y: 52, size: 2, delay: 4.3, duration: 18, driftX: 8, driftY: -24, depth: "far", motion: "c", visibility: "desktop", color: "#85D7E5" },
  { x: 37, y: 92, size: 3, delay: 7.2, duration: 13, driftX: -12, driftY: -32, depth: "mid", motion: "b", visibility: "desktop", color: "#77F2E4" },
  { x: 54, y: 58, size: 5, delay: 2.8, duration: 11, driftX: 14, driftY: -36, depth: "near", motion: "a", visibility: "desktop", color: "#83E6D4" },
  { x: 62, y: 34, size: 2, delay: 10.1, duration: 17, driftX: -8, driftY: -22, depth: "far", motion: "c", visibility: "desktop", color: "#74CFC4" },
  { x: 72, y: 27, size: 3, delay: 5.2, duration: 15, driftX: 10, driftY: -28, depth: "mid", motion: "a", visibility: "desktop", color: "#58E4F7" },
  { x: 83, y: 18, size: 2, delay: 8.9, duration: 18, driftX: -8, driftY: -20, depth: "far", motion: "c", visibility: "desktop", color: "#B6A4FF" },
  { x: 93, y: 91, size: 6, delay: 4.7, duration: 9, driftX: -18, driftY: -42, depth: "near", motion: "b", visibility: "desktop", color: "#77F2E4" },
  { x: 99, y: 63, size: 2, delay: 6.6, duration: 16, driftX: -12, driftY: -28, depth: "far", motion: "b", visibility: "desktop", color: "#9BF3D8" },
  { x: 87, y: 62, size: 4, delay: 11.2, duration: 12, driftX: 12, driftY: -34, depth: "mid", motion: "a", visibility: "desktop", color: "#EACB72" },
];

function particleVisibilityClass(visibility: ParticleVisibility): string {
  if (visibility === "desktop") return "hidden lg:block";
  if (visibility === "tablet") return "hidden sm:block";
  return "";
}

export function DashboardParticles({
  preset = "fireflies",
  accent = "#74CFC4",
}: DashboardParticlesProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
      data-preset={preset}
    >
      {DASHBOARD_PARTICLES.map((particle, index) => {
        const style = {
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          color: particle.color ?? accent,
          "--particle-delay": `${particle.delay}s`,
          "--particle-duration": `${particle.duration}s`,
          "--particle-drift-x": `${particle.driftX}px`,
          "--particle-drift-y": `${particle.driftY}px`,
        } as CSSProperties;

        return (
          <span
            key={`${particle.x}-${particle.y}-${index}`}
            className={cn(
              "dashboard-particle",
              `dashboard-particle-${particle.depth}`,
              `dashboard-particle-motion-${particle.motion}`,
              particleVisibilityClass(particle.visibility),
            )}
            style={style}
          />
        );
      })}
    </div>
  );
}
