"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useIsDarkMode } from "../../../(shared)/(hooks)/useIsDarkMode";

export type AttendancePoint = {
  shortLabel: string;
  fullLabel: string;
  attended: number;
  total: number;
};

type Props = {
  points: AttendancePoint[];
};

const PADDING = { top: 20, right: 12, bottom: 24, left: 34 };

function niceStep(range: number) {
  if (range <= 5) return 1;
  if (range <= 10) return 2;
  if (range <= 25) return 5;
  if (range <= 60) return 10;
  if (range <= 120) return 20;
  return Math.ceil(range / 5 / 25) * 25;
}

export default function AttendanceTrendChart({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lineLength, setLineLength] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isDark = useIsDarkMode();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // 새 데이터셋이 들어왔을 때만(리사이즈/호버 제외) 그려지는 애니메이션을 다시 재생한다.
  const dataSignature = points.map((p) => `${p.shortLabel}:${p.attended}`).join("|");
  const animatedForRef = useRef<string | null>(null);

  const seriesColor = isDark ? "#3987e5" : "#2C79FF";
  const surfaceColor = isDark ? "#161b26" : "#ffffff";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const axisTextColor = isDark ? "#9CA3AF" : "#6B7280";

  const lineDuration = reduceMotion ? 0 : 1.1;
  const dotBaseDelay = reduceMotion ? 0 : 0.15;
  const dotSpan = reduceMotion ? 0 : 0.9;

  const layout = useMemo(() => {
    const { width, height } = size;
    if (width <= 0 || height <= 0 || points.length === 0) return null;

    const innerWidth = Math.max(1, width - PADDING.left - PADDING.right);
    const innerHeight = Math.max(1, height - PADDING.top - PADDING.bottom);

    const values = points.map((p) => p.attended);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = Math.max(1, rawMax - rawMin);
    const step = niceStep(range);
    const yMin = Math.max(0, Math.floor(rawMin / step) * step - step);
    const yMax = Math.ceil(rawMax / step) * step + step;

    const xFor = (i: number) =>
      points.length === 1
        ? PADDING.left + innerWidth / 2
        : PADDING.left + (innerWidth * i) / (points.length - 1);
    const yFor = (v: number) =>
      PADDING.top + innerHeight - ((v - yMin) / (yMax - yMin)) * innerHeight;

    const coords = points.map((p, i) => ({ x: xFor(i), y: yFor(p.attended), point: p }));

    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const baselineY = PADDING.top + innerHeight;
    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
        : "";

    const ticks: number[] = [];
    for (let v = yMin; v <= yMax + 0.001; v += step) ticks.push(Math.round(v));

    const maxLabels = Math.max(2, Math.floor(innerWidth / 44));
    const labelStep = Math.ceil(points.length / maxLabels);

    return { width, height, innerWidth, innerHeight, coords, linePath, areaPath, ticks, yFor, labelStep, baselineY };
  }, [size, points]);

  useLayoutEffect(() => {
    if (!lineRef.current) return;
    const length = lineRef.current.getTotalLength();
    setLineLength(length);

    // 실제로 선이 측정 가능해진 시점 기준으로 재생하여, 리사이즈 관찰자의 최초 콜백
    // 타이밍과 경쟁하지 않도록 한다(마운트 시각 기준 타이머는 레이스가 생길 수 있음).
    if (length > 0 && animatedForRef.current !== dataSignature) {
      animatedForRef.current = dataSignature;
      setDrawn(false);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setDrawn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
  }, [layout?.linePath, dataSignature]);

  const handlePointerMove = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!layout || layout.coords.length === 0) return;
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const x = e.clientX - rect.left + PADDING.left;
    let nearest = 0;
    let nearestDist = Infinity;
    layout.coords.forEach((c, i) => {
      const dist = Math.abs(c.x - x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  if (points.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        표시할 출석 데이터가 없습니다.
      </div>
    );
  }

  const hovered = layout && hoverIndex !== null ? layout.coords[hoverIndex] : null;
  const lastIndex = points.length - 1;
  const lastCoord = layout?.coords[lastIndex];

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      {layout && (
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="block overflow-visible"
        >
          {layout.ticks.map((t, i) => {
            const y = layout.yFor(t);
            return (
              <g key={i}>
                <line x1={PADDING.left} x2={layout.width - PADDING.right} y1={y} y2={y} stroke={gridColor} strokeWidth={1} />
                <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fontWeight={600} fill={axisTextColor}>
                  {t}
                </text>
              </g>
            );
          })}

          {points.map((p, i) => {
            if (i !== lastIndex && i % layout.labelStep !== 0) return null;
            const x = layout.coords[i].x;
            return (
              <text key={i} x={x} y={layout.height - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill={axisTextColor}>
                {p.shortLabel}
              </text>
            );
          })}

          <path
            d={layout.areaPath}
            fill={seriesColor}
            fillOpacity={drawn ? 0.1 : 0}
            stroke="none"
            style={{ transition: `fill-opacity ${lineDuration * 0.8}s ease-out ${lineDuration * 0.4}s` }}
          />
          <path
            ref={lineRef}
            d={layout.linePath}
            fill="none"
            stroke={seriesColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={lineLength}
            strokeDashoffset={drawn ? 0 : lineLength}
            style={{ transition: `stroke-dashoffset ${lineDuration}s cubic-bezier(0.65,0,0.35,1)` }}
          />

          {layout.coords.map((c, i) => {
            const n = layout.coords.length;
            const delay = dotBaseDelay + (n > 1 ? (dotSpan * i) / (n - 1) : 0);
            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={i === lastIndex || i === hoverIndex ? 5 : 4}
                fill={seriesColor}
                stroke={surfaceColor}
                strokeWidth={2}
                style={{
                  opacity: drawn ? 1 : 0,
                  transform: drawn ? "scale(1)" : "scale(0)",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transition: `opacity 0.35s ease-out ${delay}s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, r 0.15s ease-out`,
                }}
              />
            );
          })}

          {lastCoord && (
            <text
              x={lastCoord.x}
              y={lastCoord.y - 12}
              textAnchor={lastIndex === 0 ? "start" : "end"}
              fontSize={11}
              fontWeight={700}
              fill={seriesColor}
              style={{
                opacity: drawn ? 1 : 0,
                transition: `opacity 0.4s ease-out ${lineDuration}s`,
              }}
            >
              {points[lastIndex].attended}명
            </text>
          )}

          {hovered && (
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={layout.baselineY}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          <rect
            x={PADDING.left}
            y={0}
            width={layout.innerWidth}
            height={layout.height}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>
      )}

      {hovered && layout && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs shadow-lg"
          style={{
            left: `${Math.min(Math.max(hovered.x, 64), layout.width - 64)}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold text-gray-700 dark:text-gray-200">{hovered.point.fullLabel}</div>
          <div className="mt-0.5 text-gray-500 dark:text-gray-400">
            출석 <span className="font-bold" style={{ color: seriesColor }}>{hovered.point.attended}명</span> / 전체{" "}
            {hovered.point.total}명
          </div>
        </div>
      )}
    </div>
  );
}
