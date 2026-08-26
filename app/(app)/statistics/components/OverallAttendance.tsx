"use client";

import dynamic from "next/dynamic";
import useAttendanceStore from "../../../(shared)/(store)/attendanceStore";
import useStatisticStore from "../../../(shared)/(store)/statisticStore";
import { useEffect } from "react";

const OverallAttendanceChart = dynamic(() => import("./OverallAttendanceChart"), {
  ssr: false,
  loading: () => (
    <div className="flex-[2] flex flex-col rounded-xl border border-white/45 dark:border-gray-700/60 bg-gradient-to-b from-white/25 to-white/10 dark:from-white/10 dark:to-white/5 backdrop-blur-xl backdrop-saturate-150 p-4">
      <div className="flex-1 rounded-xl border border-white/45 dark:border-gray-700/60 bg-gradient-to-b from-white/35 to-white/15 dark:from-white/10 dark:to-white/5 backdrop-blur-xl backdrop-saturate-150 flex items-center justify-center text-gray-400 dark:text-gray-500">
        로딩 중...
      </div>
    </div>
  ),
});

export default function OverallAttendance() {
  const { students, getStudents } = useAttendanceStore();
  const { sundaySummary, isLoading } = useStatisticStore();

  useEffect(() => {
    getStudents();
  }, [getStudents]);

  const latest = sundaySummary.length > 0
    ? sundaySummary[sundaySummary.length - 1]
    : null;

  const totalStudents = students.length;
  const lastSundayAttendance = latest?.attendedCount ?? 0;
  const lastSundayRate = latest && latest.totalCount > 0
    ? Math.round((latest.attendedCount / latest.totalCount) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="w-full h-full rounded-2xl bg-[rgba(236,237,255,0.55)] dark:bg-[rgba(17,24,39,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] dark:border-[rgba(75,85,99,0.35)] p-6 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl bg-[rgba(236,237,255,0.55)] dark:bg-[rgba(17,24,39,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] dark:border-[rgba(75,85,99,0.35)] p-6">
      <span className="block text-2xl font-semibold text-[#2C79FF] mb-2">전체 출석 현황</span>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-row justify-between gap-3 lg:flex-1 lg:flex-col lg:justify-center lg:gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">전체 학생</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{totalStudents}명</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">최근 일요일 출석</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{lastSundayAttendance}명</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">최근 일요일 출석률</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{lastSundayRate}%</span>
          </div>
        </div>

        <div className="flex h-[200px] lg:h-auto lg:flex-[2]">
          <OverallAttendanceChart />
        </div>
      </div>
    </div>
  );
}
