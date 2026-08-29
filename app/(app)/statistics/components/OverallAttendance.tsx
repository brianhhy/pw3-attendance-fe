"use client";

import { useEffect, useMemo } from "react";
import useAttendanceStore from "../../../(shared)/(store)/attendanceStore";
import useStatisticStore from "../../../(shared)/(store)/statisticStore";
import AttendanceTrendChart, { type AttendancePoint } from "./AttendanceTrendChart";
import { toSundayLabels } from "./dateLabel";

const WEEKS_SHOWN = 8;

export default function OverallAttendance() {
  const { students, getStudents } = useAttendanceStore();
  const { sundaySummary, isLoading } = useStatisticStore();

  useEffect(() => {
    getStudents();
  }, [getStudents]);

  const sorted = useMemo(
    () =>
      [...sundaySummary].sort((a, b) => {
        const [ay, am, ad] = a.attendanceDate;
        const [by, bm, bd] = b.attendanceDate;
        return ay - by || am - bm || ad - bd;
      }),
    [sundaySummary]
  );

  const points: AttendancePoint[] = useMemo(
    () =>
      sorted.slice(-WEEKS_SHOWN).map((item) => ({
        ...toSundayLabels(item.attendanceDate),
        attended: Number(item.attendedCount) || 0,
        total: Number(item.totalCount) || 0,
      })),
    [sorted]
  );

  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const totalStudents = students.length;
  const lastSundayAttendance = latest?.attendedCount ?? 0;
  const lastSundayRate = latest && latest.totalCount > 0 ? Math.round((latest.attendedCount / latest.totalCount) * 100) : 0;
  const previousRate =
    previous && previous.totalCount > 0 ? Math.round((previous.attendedCount / previous.totalCount) * 100) : null;
  const rateDelta = previousRate !== null ? lastSundayRate - previousRate : null;

  return (
    <div className="w-full h-full rounded-2xl border border-blue-100/70 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">전체 출석 현황</h2>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</div>
      ) : (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-44 lg:shrink-0 lg:grid-cols-1 lg:gap-3">
            <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/60 p-3">
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">전체 학생</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{totalStudents}명</div>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/60 p-3">
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">최근 주일 출석</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-[#2C79FF]">{lastSundayAttendance}명</div>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/60 p-3">
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">최근 주일 출석률</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{lastSundayRate}%</span>
                {rateDelta !== null && (
                  <span
                    className={`text-xs font-semibold ${
                      rateDelta > 0
                        ? "text-[#0ca30c]"
                        : rateDelta < 0
                          ? "text-[#d03b3b]"
                          : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {rateDelta > 0 ? "▲" : rateDelta < 0 ? "▼" : "–"} {Math.abs(rateDelta)}%p
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-[170px] sm:h-[200px] lg:h-[230px] w-full min-w-0 flex-none lg:flex-1">
            <AttendanceTrendChart points={points} />
          </div>
        </div>
      )}
    </div>
  );
}
