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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type SundayPoint = {
  label: string;
  attended: number;
  total: number;
};

type SundayStat = {
  sunday: [number, number, number];
  attendedCount: number;
  totalCount: number;
  attendanceRate: number;
};

type GradeData = {
  schoolType: "MIDDLE" | "HIGH";
  grade: 1 | 2 | 3;
  gradeName: string;
  sundayStats: SundayStat[];
};

function toIsoDateLabel(d: [number, number, number]) {
  const [y, m, day] = d;
  const mm = String(m).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export default function GradeAttendanceChart(props: {
  activeGrade?: { schoolLabel: string; grade: number } | null;
  gradeData?: GradeData | null;
}) {
  const { activeGrade, gradeData } = props;
  const label = activeGrade ? `${activeGrade.schoolLabel} ${activeGrade.grade}학년` : null;

  const [points, setPoints] = useState<SundayPoint[]>([]);

  useEffect(() => {
    if (!gradeData || !gradeData.sundayStats) {
      setPoints([]);
      return;
    }

    // sundayStats를 SundayPoint로 변환
    const convertedPoints = gradeData.sundayStats.map((stat) => ({
      label: toIsoDateLabel(stat.sunday),
      attended: stat.attendedCount,
      total: stat.totalCount,
    }));

    // 날짜 오름차순 정렬
    convertedPoints.sort((a, b) => a.label.localeCompare(b.label));

    setPoints(convertedPoints);
  }, [gradeData]);

  const displayedPoints = useMemo(() => {
    return points.slice(-6);
  }, [points]);

  const chartData = useMemo(() => {
    return {
      labels: displayedPoints.map((p) => p.label),
      datasets: [
        {
          label: label || "출석 인원",
          data: displayedPoints.map((p) => p.attended),
          borderColor: "#2C79FF",
          backgroundColor: "rgba(44,121,255,0.2)",
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#2C79FF",
          pointBorderColor: "#FFFFFF",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#2C79FF",
          pointHoverBorderWidth: 2,
          fill: false,
          tension: 0.4,
        },
      ],
    };
  }, [displayedPoints, label]);

  const chartOptions = useMemo(() => {
    const fontFamily = "Pretendard, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji";
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
        },
      },
      animation: {
        duration: 1500,
        easing: "easeInOutQuart" as const,
        animateScale: true,
        animateRotate: true,
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
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(255,255,255,0.95)",
          titleColor: "#1F2937",
          bodyColor: "#4B5563",
          borderColor: "rgba(44,121,255,0.3)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
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
              const dateLabel = displayedPoints[index]?.label;
              if (!dateLabel) return "";
              const parts = dateLabel.split("-");
              if (parts.length !== 3) return dateLabel;
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
  }, [displayedPoints]);

  if (!activeGrade) {
    return (
      <div className="w-full h-full rounded-xl bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center">
        <span className="text-gray-500 text-sm">학년을 선택하면 그래프가 표시됩니다.</span>
      </div>
    );
  }

  if (!gradeData || points.length === 0) {
    return (
      <div className="w-full h-full rounded-xl bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center">
        <span className="text-gray-500 text-sm">{label} 데이터가 없습니다.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl bg-white/30 backdrop-blur-md border border-white/60 p-4 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-3">{label} 출석 추이</h3>
      <div className="flex-1 rounded-lg border border-white/45 bg-gradient-to-b from-white/35 to-white/15 backdrop-blur-xl backdrop-saturate-150 overflow-hidden">
        <div className="h-full p-2" key={`chart-${points.length}-${points[0]?.label ?? 'empty'}`}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
