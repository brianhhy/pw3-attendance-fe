"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ArrowRight } from "lucide-react";
import { useTeacherAttendanceQuery } from "@/app/(shared)/(hooks)/useTeacherAttendance";
import { getTeacherList } from "@/app/(shared)/(api)/teacher";
import { queryKeys } from "@/app/(shared)/(api)/queryKeys";
import { getTodayKST } from "@/app/(shared)/utils/dateUtil";

const formatKoreanDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

export default function TeacherAttendanceSummaryCard() {
  const today = getTodayKST();

  const { data: teachers = [], isLoading: isTeachersLoading } = useQuery({
    queryKey: queryKeys.teachersList(),
    queryFn: getTeacherList,
  });

  const { data: attendanceStatuses = {}, isLoading: isStatusLoading } =
    useTeacherAttendanceQuery(today);

  const isLoading = isTeachersLoading || isStatusLoading;

  const stats = useMemo(() => {
    const total = teachers.length;
    let present = 0;
    let absent = 0;

    teachers.forEach((t: { id: number }) => {
      const status = attendanceStatuses[t.id]?.status;
      if (!status) return;
      const upper = String(status).toUpperCase();
      if (upper === "ATTEND" || upper === "ATTENDED" || upper === "LATE") present++;
      else if (upper === "ABSENT") absent++;
    });

    const unrecorded = total - present - absent;
    const markedPct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
    return { total, present, absent, unrecorded, markedPct };
  }, [teachers, attendanceStatuses]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700" />
            선생님 출석 현황
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{formatKoreanDate(today)}</p>
        </div>
        <Link
          href="/attendance"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
        >
          출석 체크 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-8 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3.5 w-10 bg-gray-200 rounded-full" />
              <div className="h-8 w-12 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-gray-500 mb-1">출석</p>
            <p className="text-3xl font-bold text-emerald-500">{stats.present}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">결석</p>
            <p className="text-3xl font-bold text-red-500">{stats.absent}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">미입력</p>
            <p className="text-3xl font-bold text-gray-400">{stats.unrecorded}</p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-300">매주 일요일만 집계합니다</p>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">출석률</span>
        {isLoading ? (
          <div className="h-4 w-10 bg-gray-200 rounded-full animate-pulse" />
        ) : (
          <span className="text-sm font-bold text-gray-800">{stats.markedPct}%</span>
        )}
      </div>
    </div>
  );
}
