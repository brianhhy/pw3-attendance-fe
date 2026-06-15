"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeacherList } from "../../(shared)/(api)/teacher";
import { queryKeys } from "../../(shared)/(api)/queryKeys";
import {
  useTeacherAttendanceQuery,
  useMarkTeacherAttendance,
  getTeacherAttendanceStatus,
} from "../../(shared)/(hooks)/useTeacherAttendance";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";

type Status = "ATTEND" | "LATE" | "ABSENT" | "OTHER";

const STATUS_META: Record<Status, { label: string; bg: string; text: string; ring: string }> = {
  ATTEND: { label: "출석", bg: "bg-[#e8fde8]", text: "text-[#00CB18]", ring: "ring-[#00CB18]" },
  LATE:   { label: "지각", bg: "bg-[#fff4e0]", text: "text-[#F39200]", ring: "ring-[#F39200]" },
  ABSENT: { label: "결석", bg: "bg-[#ffeaea]", text: "text-[#F65656]", ring: "ring-[#F65656]" },
  OTHER:  { label: "기타", bg: "bg-[#e8eeff]", text: "text-[#2C79FF]", ring: "ring-[#2C79FF]" },
};

const STATUSES: Status[] = ["ATTEND", "LATE", "ABSENT", "OTHER"];

interface TeacherListItem {
  id: number;
  name: string;
  teacherType?: string | null;
  classesByYear?: {
    [year: string]: { schoolType: string; grade: number; classNumber: number }[];
  };
}

const SCHOOL_SHORT: Record<string, string> = { MIDDLE: "중", HIGH: "고", ELEMENTARY: "초" };

function getTeacherRole(teacher: TeacherListItem): string {
  const year = String(new Date().getFullYear());
  const classes = teacher.classesByYear?.[year];
  if (classes && classes.length > 0)
    return classes.map((c) => `${SCHOOL_SHORT[c.schoolType] ?? ""}${c.grade}-${c.classNumber}반`).join(", ");
  if (teacher.teacherType === "HELPER") return "헬퍼";
  if (teacher.teacherType === "PASTOR") return "교역자";
  return "교사";
}

export default function TeacherAttendanceSection() {
  const { selectedDate } = useAttendanceStore();
  const [search, setSearch] = useState("");

  const { data: teachers = [], isLoading } = useQuery<TeacherListItem[]>({
    queryKey: queryKeys.teachersList(),
    queryFn: getTeacherList,
  });
  const { data: statuses = {} } = useTeacherAttendanceQuery(selectedDate);
  const { mutate: mark } = useMarkTeacherAttendance(selectedDate);

  const filtered = search.trim()
    ? teachers.filter((t) => t.name.includes(search))
    : teachers;

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = teachers.filter((t) => getTeacherAttendanceStatus(statuses, t.id) === s).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div className="h-[75vh] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-end justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">선생님 출석</h2>
          <p className="text-xs text-gray-400 mt-0.5">총 {teachers.length}명</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {STATUSES.map((s) => {
            const m = STATUS_META[s];
            return (
              <div key={s} className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${m.bg}`}>
                <span className={`text-xs font-bold ${m.text}`}>{m.label}</span>
                <span className={`text-xs font-semibold ${m.text}`}>{counts[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 검색 */}
      <div className="flex-shrink-0 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름으로 검색"
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-[#8B8FFF] transition-colors placeholder:text-gray-300"
        />
      </div>

      {/* 리스트 - 남은 공간 채우고 스크롤 */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-28" />
                </div>
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-7 w-12 bg-gray-100 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {search ? "검색 결과가 없습니다" : "선생님이 없습니다"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((teacher) => {
              const current = getTeacherAttendanceStatus(statuses, teacher.id);
              const meta = current ? STATUS_META[current] : null;

              return (
                <div key={teacher.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  {/* 아바타 */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${
                      meta ? `${meta.bg} ${meta.text}` : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {teacher.name.charAt(0)}
                  </div>

                  {/* 이름·역할 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{teacher.name}</p>
                    <p className="text-xs text-gray-400 truncate">{getTeacherRole(teacher)}</p>
                  </div>

                  {/* 상태 토글 */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {STATUSES.map((s) => {
                      const m = STATUS_META[s];
                      const isActive = current === s;
                      return (
                        <button
                          key={s}
                          onClick={() => mark({ teacherId: teacher.id, status: s })}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            isActive
                              ? `${m.bg} ${m.text} ring-1 ${m.ring}`
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
