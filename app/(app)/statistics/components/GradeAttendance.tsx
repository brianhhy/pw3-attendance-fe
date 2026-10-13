"use client";

import { useMemo, useState } from "react";
import useStatisticStore, { type GradeData } from "../../../(shared)/(store)/statisticStore";
import AttendanceTrendChart, { type AttendancePoint } from "./AttendanceTrendChart";
import { toSundayLabels } from "./dateLabel";

const WEEKS_SHOWN = 8;

type GradeKey = "MIDDLE-1" | "MIDDLE-2" | "MIDDLE-3" | "HIGH-1" | "HIGH-2" | "HIGH-3";

const GRADE_ITEMS: Array<{ key: GradeKey; schoolType: "MIDDLE" | "HIGH"; label: string; fullLabel: string }> = [
  { key: "MIDDLE-1", schoolType: "MIDDLE", label: "중1", fullLabel: "중학교 1학년" },
  { key: "MIDDLE-2", schoolType: "MIDDLE", label: "중2", fullLabel: "중학교 2학년" },
  { key: "MIDDLE-3", schoolType: "MIDDLE", label: "중3", fullLabel: "중학교 3학년" },
  { key: "HIGH-1", schoolType: "HIGH", label: "고1", fullLabel: "고등학교 1학년" },
  { key: "HIGH-2", schoolType: "HIGH", label: "고2", fullLabel: "고등학교 2학년" },
  { key: "HIGH-3", schoolType: "HIGH", label: "고3", fullLabel: "고등학교 3학년" },
];

function gradeKeyOf(g: GradeData): GradeKey | null {
  const schoolType = String(g.schoolType).toUpperCase();
  if ((schoolType === "MIDDLE" || schoolType === "HIGH") && (g.grade === 1 || g.grade === 2 || g.grade === 3)) {
    return `${schoolType}-${g.grade}` as GradeKey;
  }
  return null;
}

export default function GradeAttendance() {
  const { gradeSundayStats, isLoading } = useStatisticStore();
  const [activeKey, setActiveKey] = useState<GradeKey | null>(null);

  const byKey = useMemo(() => {
    const map = new Map<GradeKey, GradeData>();
    gradeSundayStats.forEach((g) => {
      const key = gradeKeyOf(g);
      if (key) map.set(key, g);
    });
    return map;
  }, [gradeSundayStats]);

  const tileStats = useMemo(() => {
    const result = new Map<GradeKey, { total: number; rate: number }>();
    GRADE_ITEMS.forEach((item) => {
      const g = byKey.get(item.key);
      if (!g || g.sundayStats.length === 0) {
        result.set(item.key, { total: 0, rate: 0 });
        return;
      }
      const sorted = [...g.sundayStats].sort((a, b) => {
        const [ay, am, ad] = a.sunday;
        const [by, bm, bd] = b.sunday;
        return ay - by || am - bm || ad - bd;
      });
      const latest = sorted[sorted.length - 1];
      const recent5 = sorted.slice(-5);
      const avgRate = Math.round(recent5.reduce((sum, s) => sum + s.attendanceRate, 0) / recent5.length);
      result.set(item.key, { total: latest.totalCount, rate: avgRate });
    });
    return result;
  }, [byKey]);

  const activeItem = GRADE_ITEMS.find((item) => item.key === activeKey) ?? null;

  const activePoints: AttendancePoint[] = useMemo(() => {
    if (!activeKey) return [];
    const g = byKey.get(activeKey);
    if (!g) return [];
    return [...g.sundayStats]
      .sort((a, b) => {
        const [ay, am, ad] = a.sunday;
        const [by, bm, bd] = b.sunday;
        return ay - by || am - bm || ad - bd;
      })
      .slice(-WEEKS_SHOWN)
      .map((s) => ({
        ...toSundayLabels(s.sunday),
        attended: s.attendedCount,
        total: s.totalCount,
      }));
  }, [activeKey, byKey]);

  return (
    <div className="w-full h-full rounded-2xl border border-blue-100/70 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">학년별 통계</h2>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</div>
      ) : (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-64 lg:shrink-0 lg:grid-cols-2">
            {GRADE_ITEMS.map((item) => {
              const stats = tileStats.get(item.key) ?? { total: 0, rate: 0 };
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveKey((prev) => (prev === item.key ? null : item.key))}
                  className={`rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C79FF]/50 ${
                    isActive
                      ? "border-[#2C79FF] bg-blue-50 dark:border-[#3987e5] dark:bg-blue-950/40"
                      : "border-gray-100 bg-gray-50/80 hover:bg-gray-100/80 dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-50">{item.label}</div>
                  <div className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    전체 <span className="font-semibold text-gray-700 dark:text-gray-200">{stats.total}명</span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    평균 출석률 <span className="font-semibold text-[#2C79FF]">{stats.rate}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="h-[170px] sm:h-[200px] lg:h-[230px] w-full min-w-0 flex-none lg:flex-1">
            {activeItem ? (
              <div className="flex h-full flex-col">
                <div className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {activeItem.fullLabel} 출석 추이
                </div>
                <div className="min-h-0 flex-1">
                  <AttendanceTrendChart points={activePoints} />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                학년을 선택하면 출석 추이를 볼 수 있어요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
