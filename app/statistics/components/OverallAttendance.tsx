"use client";

import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import useStatisticStore from "../../(shared)/(store)/statisticStore";
import OverallAttendanceChart from "./OverallAttendanceChart";
import { useEffect } from "react";

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
      <div className="w-full h-full rounded-2xl bg-[rgba(236,237,255,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] p-6 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl bg-[rgba(236,237,255,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] p-6">
      <span className="block text-2xl font-semibold text-[#2C79FF] mb-2">전체 출석 현황</span>

      <div className="flex gap-6">
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">전체 학생</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{totalStudents}명</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">최근 일요일 출석</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{lastSundayAttendance}명</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">최근 일요일 출석률</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{lastSundayRate}%</span>
          </div>
        </div>

        <OverallAttendanceChart />
      </div>
    </div>
  );
}
