"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeacherList } from "../../../(shared)/(api)/teacher";
import { queryKeys } from "../../../(shared)/(api)/queryKeys";
import {
  useStudentAttendanceQuery,
  useMarkStudentAttendance,
} from "../../../(shared)/(hooks)/useStudentAttendance";
import {
  useTeacherAttendanceQuery,
  useMarkTeacherAttendance,
  getTeacherAttendanceStatus,
} from "../../../(shared)/(hooks)/useTeacherAttendance";
import useAttendanceStore from "../../../(shared)/(store)/attendanceStore";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import DatePicker from "../../../(shared)/(components)/DatePicker";

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

interface RosterPerson {
  key: string;
  type: "student" | "teacher";
  id: number;
  name: string;
  subtitle: string;
  status: Status | null;
  studentClassId?: number;
}

export default function AttendanceRoster() {
  const { selectedDate, setSelectedDate, headerSearch, setHeaderSearch } = useAttendanceStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (headerSearch?.type === "student" || headerSearch?.type === "teacher") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(headerSearch.query);
      setHeaderSearch(null);
    }
  }, [headerSearch, setHeaderSearch]);

  const { data: classData = [], isLoading: isStudentsLoading } = useStudentAttendanceQuery(selectedDate);
  const { mutate: markStudent } = useMarkStudentAttendance(selectedDate);

  const { data: teachers = [], isLoading: isTeachersLoading } = useQuery<TeacherListItem[]>({
    queryKey: queryKeys.teachersList(),
    queryFn: getTeacherList,
  });
  const { data: teacherStatuses = {} } = useTeacherAttendanceQuery(selectedDate);
  const { mutate: markTeacher } = useMarkTeacherAttendance(selectedDate);

  const isLoading = isStudentsLoading || isTeachersLoading;

  const roster = useMemo<RosterPerson[]>(() => {
    const studentRows: RosterPerson[] = classData.flatMap((cls) =>
      cls.students.map((s) => ({
        key: `student-${s.id}`,
        type: "student" as const,
        id: s.id,
        name: s.name,
        subtitle: cls.className,
        status: s.status ? (s.status.toUpperCase() as Status) : null,
        studentClassId: s.studentClassId,
      }))
    );

    const teacherRows: RosterPerson[] = teachers.map((t) => ({
      key: `teacher-${t.id}`,
      type: "teacher" as const,
      id: t.id,
      name: t.name,
      subtitle: getTeacherRole(t),
      status: getTeacherAttendanceStatus(teacherStatuses, t.id),
    }));

    return [...studentRows, ...teacherRows].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [classData, teachers, teacherStatuses]);

  const filtered = search.trim()
    ? roster.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : roster;

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = roster.filter((p) => p.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  const studentCount = roster.filter((p) => p.type === "student").length;
  const teacherCount = roster.filter((p) => p.type === "teacher").length;

  const handleMark = (person: RosterPerson, status: Status) => {
    if (person.type === "student") {
      if (!person.studentClassId) return;
      markStudent({ studentId: person.id, studentClassId: person.studentClassId, status });
    } else {
      markTeacher({ teacherId: person.id, status });
    }
  };

  return (
    <div className="h-[75vh] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-end justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">출결 관리</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            총 {roster.length}명 · 학생 {studentCount}명 · 선생님 {teacherCount}명
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
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
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#8B8FFF] transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
      </div>

      {/* 리스트 - 남은 공간 채우고 스크롤 */}
      <CustomScrollbar className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-28" />
                </div>
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-7 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
            {search ? "검색 결과가 없습니다" : "인원이 없습니다"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map((person) => {
              const meta = person.status ? STATUS_META[person.status] : null;

              return (
                <div key={person.key} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors">
                  {/* 아바타 */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${
                      meta ? `${meta.bg} ${meta.text}` : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {person.name.charAt(0)}
                  </div>

                  {/* 이름·구분·소속 */}
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      <span className="truncate">{person.name}</span>
                      <span
                        className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          person.type === "student"
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300"
                        }`}
                      >
                        {person.type === "student" ? "학생" : "선생님"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{person.subtitle}</p>
                  </div>

                  {/* 상태 토글 */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {STATUSES.map((s) => {
                      const m = STATUS_META[s];
                      const isActive = person.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleMark(person, s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            isActive
                              ? `${m.bg} ${m.text} ring-1 ${m.ring}`
                              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
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
      </CustomScrollbar>
    </div>
  );
}
