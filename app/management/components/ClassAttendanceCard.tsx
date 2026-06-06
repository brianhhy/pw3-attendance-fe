"use client";

import { useRef, useState } from "react";
import {
  useStudentAttendanceQuery,
  useMarkStudentAttendance,
  type ClassData,
} from "../../(shared)/(hooks)/useStudentAttendance";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";

const STATUSES = [
  { key: "attended", api: "ATTEND", label: "출석", activeClass: "bg-[#9efc9b] text-[#00cb18]" },
  { key: "late",     api: "LATE",   label: "지각", activeClass: "bg-[#fcd39b] text-[#f39200]" },
  { key: "absent",   api: "ABSENT", label: "결석", activeClass: "bg-[#F44336] text-white" },
  { key: "other",    api: "OTHER",  label: "기타", activeClass: "bg-[#B3CFFF] text-[#2C79FF]" },
] as const;

function ClassCard({ classData, date, searchQuery }: { classData: ClassData; date: string; searchQuery: string }) {
  const { mutate: markAttendance } = useMarkStudentAttendance(date);
  const listRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ y: 0, scrollTop: 0 });

  const filteredStudents = searchQuery.trim()
    ? classData.students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : classData.students;

  const attendedCount = classData.students.filter((s) => s.status === "attended").length;

  const onMouseDown = (e: React.MouseEvent) => {
    if (!listRef.current) return;
    setIsDragging(false);
    dragStart.current = { y: e.clientY, scrollTop: listRef.current.scrollTop };
    listRef.current.style.cursor = "grabbing";

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientY - dragStart.current.y;
      if (Math.abs(delta) > 3) setIsDragging(true);
      listRef.current!.scrollTop = dragStart.current.scrollTop - delta;
    };

    const onMouseUp = () => {
      listRef.current!.style.cursor = "grab";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px] max-w-[430px]">
      {/* 카드 헤더 */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 bg-[#f3f3fe]">
        <h3 className="text-lg font-bold text-gray-900">{classData.className}</h3>
        <p className="text-sm text-gray-400 mt-0.5">
          {classData.students.length}명 · 담임: {classData.teacherName}
          {attendedCount > 0 && (
            <span className="ml-2 text-[#00CB18] font-medium">({attendedCount}명 출석)</span>
          )}
        </p>
      </div>

      <div className="border-t border-gray-100 flex-shrink-0" />

      {/* 학생 목록 — 드래그 스크롤 */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto divide-y divide-gray-50 cursor-grab select-none"
        onMouseDown={onMouseDown}
      >
        {filteredStudents.map((student) => (
          <div key={student.id} className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
            <p className="flex-1 text-sm font-semibold text-gray-900 truncate">
              {student.name}
            </p>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {STATUSES.map(({ key, api, label, activeClass }) => (
                <button
                  key={key}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (isDragging) return;
                    markAttendance({
                      studentId: student.id,
                      studentClassId: student.studentClassId!,
                      status: api,
                    });
                  }}
                  className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                    student.status === key ? activeClass : "text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClassAttendanceCard() {
  const { selectedDate, headerSearch } = useAttendanceStore();
  const { data: classData = [], isLoading } = useStudentAttendanceQuery(selectedDate);

  const searchQuery = headerSearch?.type === "student" ? headerSearch.query : "";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-[400px]">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
        ))}
      </div>
    );
  }

  if (classData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        반 정보가 없습니다.
      </div>
    );
  }

  const visibleClasses = searchQuery.trim()
    ? classData.filter((cls) =>
        cls.students.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : classData;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleClasses.map((cls) => (
        <ClassCard key={cls.id ?? cls.className} classData={cls} date={selectedDate} searchQuery={searchQuery} />
      ))}
    </div>
  );
}
