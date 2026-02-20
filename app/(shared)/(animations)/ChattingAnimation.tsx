"use client";

import { useEffect, useRef, useCallback } from "react";

const WAVE_SPEED  = 0.003;
const WAVE_SPREAD = 0.2;
const LIFT_PX     = 5;
const BASE_RGB    = [107, 114, 128]; // gray-500
const WAVE_RGB    = [44, 121, 255];  // #2C79FF

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function softPeak(sin: number) { return Math.max(0, sin) ** 1.6; }

interface WaveLoadingTextProps {
  text?: string;
  waveColor?: [number, number, number];
  baseColor?: [number, number, number];
  liftPx?: number;
  waveSpeed?: number;
  waveSpread?: number;
}

export function WaveLoadingText({
  text = "응답을 생성하고 있습니다...",
  waveColor = WAVE_RGB as [number, number, number],
  baseColor = BASE_RGB as [number, number, number],
  liftPx = LIFT_PX,
  waveSpeed = WAVE_SPEED,
  waveSpread = WAVE_SPREAD,
}: WaveLoadingTextProps) {
  const chars = [...text].map((c) => (c === " " ? "\u00A0" : c));
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback((ts: number) => {
    const phase = ts * waveSpeed;
    spanRefs.current.forEach((span, i) => {
      if (!span) return;
      const sin = Math.sin(phase - i * waveSpread);
      const t = softPeak(sin);
      const y = -liftPx * t;
      const r = Math.round(lerp(baseColor[0], waveColor[0], t));
      const g = Math.round(lerp(baseColor[1], waveColor[1], t));
      const b = Math.round(lerp(baseColor[2], waveColor[2], t));
      span.style.transform = `translateY(${y.toFixed(2)}px)`;
      span.style.color = `rgb(${r},${g},${b})`;
    });
    rafRef.current = requestAnimationFrame(animate);
  }, [waveColor, baseColor, liftPx, waveSpeed, waveSpread]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return (
    <div className="wave-text text-sm">
      {chars.map((char, i) => (
        <span key={i} ref={(el) => { spanRefs.current[i] = el; }}>
          {char}
        </span>
      ))}
    </div>
  );
}
