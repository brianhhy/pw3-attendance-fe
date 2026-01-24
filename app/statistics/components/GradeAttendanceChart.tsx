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
import { ClassRoom, getClassRoomSundaySummary, type ClassRoomSundaySummaryItem } from "../../(shared)/(api)/classroom";

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

export default function GradeAttendanceChart(props: {
  activeGrade?: { schoolLabel: string; grade: number } | null;
  classRooms?: ClassRoom[];
}) {
  const { activeGrade, classRooms = [] } = props;
  const label = activeGrade ? `${activeGrade.schoolLabel} ${activeGrade.grade}학년` : null;

  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState<SundayPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [classRoomDataMap, setClassRoomDataMap] = useState<Map<number, SundayPoint[]>>(new Map());

  useEffect(() => {
    if (classRooms.length === 0) {
      setPoints([]);
      setClassRoomDataMap(new Map());
      setIsLoading(false);
      setError(null);
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 모든 반의 데이터를 병렬로 fetch
        const allData = await Promise.all(
          classRooms.map((c) => getClassRoomSundaySummary(c.id))
        );

        // 전체 날짜 목록 수집 (합집합)
        const allDatesSet = new Set<string>();
        allData.forEach((classData) => {
          if (!Array.isArray(classData)) return;
          classData.forEach((item: ClassRoomSundaySummaryItem) => {
            allDatesSet.add(toIsoDateLabel(item.sunday));
          });
        });

        const allDates = Array.from(allDatesSet).sort((a, b) => a.localeCompare(b));

        // 각 반별로 데이터를 Map에 저장
        const newMap = new Map<number, SundayPoint[]>();
        classRooms.forEach((classroom, idx) => {
          const classData = allData[idx];
          if (!Array.isArray(classData)) return;

          const dataMap = new Map<string, { attended: number; total: number }>();
          classData.forEach((item: ClassRoomSundaySummaryItem) => {
            const dateLabel = toIsoDateLabel(item.sunday);
            dataMap.set(dateLabel, {
              attended: Number(item.attendedCount) || 0,
              total: Number(item.totalCount) || 0,
            });
          });

          // 모든 날짜에 대해 데이터 생성 (없으면 0)
          const points = allDates.map((dateLabel) => {
            const data = dataMap.get(dateLabel) || { attended: 0, total: 0 };
            return {
              label: dateLabel,
              attended: data.attended,
              total: data.total,
            };
          });

          newMap.set(classroom.id, points);
        });

        setClassRoomDataMap(newMap);
        setPoints(allDates.map((dateLabel) => ({ label: dateLabel, attended: 0, total: 0 })));
      } catch (e: any) {
        setError("반별 출석 요약을 불러오지 못했습니다.");
        setPoints([]);
        setClassRoomDataMap(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [classRooms]);

  const displayedPoints = useMemo(() => {
    return points.slice(-6);
  }, [points]);

  const COLORS = [
    { border: "#2C79FF", bg: "rgba(44,121,255,0.2)" },
    { border: "#10B981", bg: "rgba(16,185,129,0.2)" },
    { border: "#F59E0B", bg: "rgba(245,158,11,0.2)" },
    { border: "#EF4444", bg: "rgba(239,68,68,0.2)" },
    { border: "#8B5CF6", bg: "rgba(139,92,246,0.2)" },
    { border: "#EC4899", bg: "rgba(236,72,153,0.2)" },
    { border: "#06B6D4", bg: "rgba(6,182,212,0.2)" },
    { border: "#84CC16", bg: "rgba(132,204,22,0.2)" },
  ];

  const chartData = useMemo(() => {
    const datasets = classRooms.map((classroom, idx) => {
      const classPoints = classRoomDataMap.get(classroom.id) || [];
      const displayedClassPoints = classPoints.slice(-6);
      const color = COLORS[idx % COLORS.length];

      return {
        label: classroom.name || `${classroom.grade}학년 ${classroom.classNumber}반`,
        data: displayedClassPoints.map((p) => p.attended),
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color.border,
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "#FFFFFF",
        pointHoverBorderColor: color.border,
        pointHoverBorderWidth: 2,
        fill: false,
        tension: 0.4,
      };
    });

    return {
      labels: displayedPoints.map((p) => p.label),
      datasets,
    };
  }, [displayedPoints, classRooms, classRoomDataMap]);

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
          display: true,
          position: "top" as const,
          align: "start" as const,
          labels: {
            font: { family: fontFamily, size: 11, weight: 500 },
            color: "#4B5563",
            padding: 12,
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 8,
            boxHeight: 8,
          },
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
              const datasetLabel = ctx.dataset.label || "";
              const value = ctx.parsed?.y ?? "-";
              return `${datasetLabel}: ${value}명`;
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
      <div className="w-full flex mt-6">
        <div className="flex-1 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 px-6 py-5">
          <div className="w-full min-h-[240px] rounded-xl border border-white/60 bg-white/25 backdrop-blur-md flex items-center justify-center text-gray-500">
            학년을 선택하면 그래프가 표시됩니다.
          </div>
        </div>
      </div>
    );
  }

  if (classRooms.length === 0) {
    return (
      <div className="w-full flex mt-6">
        <div className="flex-1 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 px-6 py-5">
          <div className="w-full min-h-[240px] rounded-xl border border-white/60 bg-white/25 backdrop-blur-md flex items-center justify-center text-gray-500">
            {label} 반이 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex mt-6">
      <div className="flex-1 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 px-6 py-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{label} 출석 추이</h3>
        <div className="w-full rounded-xl border border-white/45 bg-gradient-to-b from-white/35 to-white/15 backdrop-blur-xl backdrop-saturate-150 min-h-[240px] overflow-hidden">
          {isLoading ? (
            <div className="h-full min-h-[240px] flex items-center justify-center text-gray-400">로딩 중...</div>
          ) : error ? (
            <div className="h-full min-h-[240px] flex items-center justify-center text-gray-400">{error}</div>
          ) : points.length === 0 ? (
            <div className="h-full min-h-[240px] flex items-center justify-center text-gray-400">데이터가 없습니다.</div>
          ) : (
            <div className="h-full min-h-[240px] p-2" key={`chart-${points.length}-${points[0]?.label ?? 'empty'}`}>
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
