"use client";

import type { ReactNode } from "react";
import useThemeStore from "@/app/(shared)/(store)/themeStore";
import MagicBentoCard from "./MagicBentoCard";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

const DEFAULT_GLOW_COLOR = "44, 121, 255";

const toGlowColor = (rgbaOrRgb?: string) => {
  if (!rgbaOrRgb) return undefined;
  const match = rgbaOrRgb.match(/\d+\s*,\s*\d+\s*,\s*\d+/);
  return match?.[0];
};

export default function SpotlightCard({ children, className = "", spotlightColor }: SpotlightCardProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <MagicBentoCard
      glowColor={toGlowColor(spotlightColor) ?? DEFAULT_GLOW_COLOR}
      className={`rounded-2xl border shadow-sm ${
        isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white"
      } ${className}`}
    >
      {children}
    </MagicBentoCard>
  );
}
