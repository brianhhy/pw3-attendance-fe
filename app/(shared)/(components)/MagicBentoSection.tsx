"use client";

import { useRef, type ReactNode } from "react";
import GlobalSpotlight from "./GlobalSpotlight";

interface MagicBentoSectionProps {
  children: ReactNode;
  enabled: boolean;
  glowColor?: string;
  spotlightRadius?: number;
}

export default function MagicBentoSection({ children, enabled, glowColor, spotlightRadius }: MagicBentoSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={sectionRef} className="bento-section">
      {children}
      <GlobalSpotlight gridRef={sectionRef} enabled={enabled} glowColor={glowColor} spotlightRadius={spotlightRadius} />
    </div>
  );
}
