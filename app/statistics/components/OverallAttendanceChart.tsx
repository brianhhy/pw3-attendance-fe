"use client";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getSundayAttendanceSummary } from "@/app/(shared)/(api)/statistics";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type SundayPoint = {
  label: string;
  attended: number;
  total: number;
};

function toIsoDateLabel(d: [number, number, number]) {
  const [y, m, day] = d;
  const mm = String(m).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export default function OverallAttendanceChart() {

  const [isLoading, setIsLoading] = useState(true);
  const [points, setPoints] = useState<SundayPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSundayAttendanceSummary();
        const next = (Array.isArray(data) ? data : [])
          .map((item) => ({
            label: toIsoDateLabel(item.attendanceDate),
            attended: Number(item.attendedCount) || 0,
            total: Number(item.totalCount) || 0,
          }))
          // 날짜 오름차순 정렬(문자열 ISO 형식이라 정렬 가능)
          .sort((a, b) => a.label.localeCompare(b.label));
        setPoints(next);
      } catch (e: any) {
        setError("일요일별 출석 요약을 불러오지 못했습니다.");
        setPoints([]);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const displayedPoints = useMemo(() => {
    // 너무 휑/촘촘해지지 않도록 최근 6개만 표시
    return points.slice(-6);
  }, [points]);

  const chartData = useMemo(() => {
    return {
      labels: displayedPoints.map((p) => p.label),
      datasets: [
        {
          label: "출석 인원",
          data: displayedPoints.map((p) => p.attended),
          borderColor: "#2C79FF",
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(44,121,255,0.35)");
            gradient.addColorStop(0.5, "rgba(44,121,255,0.15)");
            gradient.addColorStop(1, "rgba(44,121,255,0.02)");
            return gradient;
          },
          pointBackgroundColor: "#2C79FF",
          pointBorderColor: "#FFFFFF",
          pointBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 4,
          pointHoverBackgroundColor: "#1D5FD9",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          shadowBlur: 10,
          shadowColor: "rgba(44,121,255,0.3)",
        },
      ],
    };
  }, [displayedPoints]);

  const yRange = useMemo(() => {
    if (displayedPoints.length === 0) return null;
    const ys = displayedPoints.map((p) => p.attended);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const span = Math.max(1, max - min);
    const pad = Math.max(2, Math.round(span * 0.15));
    return {
      suggestedMin: Math.max(0, min - pad),
      suggestedMax: max + pad,
    };
  }, [displayedPoints]);

  const chartOptions = useMemo(() => {
    const fontFamily =
      "Pretendard, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji";
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1500,
        easing: "easeInOutQuart" as const,
        onComplete: () => {
          console.log("Chart animation completed");
        },
      },
      transitions: {
        active: {
          animation: {
            duration: 400,
          },
        },
      },
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(255,255,255,0.95)",
          titleColor: "#1F2937",
          bodyColor: "#4B5563",
          borderColor: "rgba(44,121,255,0.3)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          titleFont: { family: fontFamily, size: 13, weight: 600 },
          bodyFont: { family: fontFamily, size: 12, weight: 500 },
          padding: 12,
          callbacks: {
            label: (ctx: any) => {
              const idx = ctx.dataIndex ?? 0;
              const p = displayedPoints[idx];
              if (!p) return `출석 인원: ${ctx.parsed?.y ?? "-"}`;
              return `출석 인원: ${p.attended} / 전체: ${p.total}`;
            },
          },
        },
        title: { display: false },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
          ticks: {
            display: true,
            color: "#6B7280",
            maxRotation: 0,
            autoSkip: false,
            padding: 10,
            font: { family: fontFamily, size: 11, weight: 600 },
            callback: (_value: any, index: number) => {
              const label = displayedPoints[index]?.label;
              if (!label) return "";
              const parts = label.split("-");
              if (parts.length !== 3) return label;
              return `${parts[1]}-${parts[2]}`;
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#6B7280", font: { family: fontFamily, size: 11, weight: 600 } },
          grid: { color: "rgba(255,255,255,0.35)" },
        },
      },
    } as const;
  }, [displayedPoints, yRange]);

  return (
    <div className="flex-[2] flex flex-col rounded-xl border border-white/45 bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-xl backdrop-saturate-150 p-4">
      <div className="flex-1 rounded-xl border border-white/45 bg-gradient-to-b from-white/35 to-white/15 backdrop-blur-xl backdrop-saturate-150 min-h-[240px] overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">로딩 중...</div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-gray-400">{error}</div>
        ) : points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">데이터가 없습니다.</div>
        ) : (
          <div className="h-full p-2" key={`chart-${points.length}-${points[0]?.label ?? 'empty'}`}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}