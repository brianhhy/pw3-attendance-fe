"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AnimatedList from "@/components/ui/AnimatedList";
import { getBirthdays, BirthdayStudent, BirthdayTeacher } from "../(api)/birth";
import { queryKeys } from "../(api)/queryKeys";

interface MonthBirthdayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonth?: number;
}

interface DayGroup {
  day: number;
  students: BirthdayStudent[];
  teachers: BirthdayTeacher[];
}

type BirthdayRow =
  | { kind: "header"; key: string; day: number; count: number }
  | { kind: "student"; key: string; day: number; student: BirthdayStudent }
  | { kind: "teacher"; key: string; day: number; teacher: BirthdayTeacher };

const toRows = (dayGroups: DayGroup[]): BirthdayRow[] =>
  dayGroups.flatMap((group) => [
    { kind: "header" as const, key: `h-${group.day}`, day: group.day, count: group.students.length + group.teachers.length },
    ...group.students.map((s) => ({ kind: "student" as const, key: `s-${s.id}`, day: group.day, student: s })),
    ...group.teachers.map((t) => ({ kind: "teacher" as const, key: `t-${t.id}`, day: group.day, teacher: t })),
  ]);

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MonthBirthday({ open, onOpenChange, initialMonth }: MonthBirthdayProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => initialMonth ?? new Date().getMonth() + 1);

  useEffect(() => {
    if (open && initialMonth != null) {
      setSelectedMonth(initialMonth);
    } else if (open) {
      setSelectedMonth(new Date().getMonth() + 1);
    }
  }, [open, initialMonth]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.birthdays(selectedMonth),
    queryFn: () => getBirthdays(selectedMonth),
    enabled: open,
  });

  const dayGroups = useMemo<DayGroup[]>(() => {
    if (!data) return [];
    const map = new Map<number, DayGroup>();
    data.students.forEach((s) => {
      const day = s.birth[2];
      if (!map.has(day)) map.set(day, { day, students: [], teachers: [] });
      map.get(day)!.students.push(s);
    });
    data.teachers.forEach((t) => {
      const day = t.birth[2];
      if (!map.has(day)) map.set(day, { day, students: [], teachers: [] });
      map.get(day)!.teachers.push(t);
    });
    return Array.from(map.values()).sort((a, b) => a.day - b.day);
  }, [data]);

  const totalCount = dayGroups.reduce((acc, g) => acc + g.students.length + g.teachers.length, 0);
  const rows = useMemo(() => toRows(dayGroups), [dayGroups]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[85vh] bg-white dark:bg-gray-900 border-none rounded-3xl p-0 shadow-2xl flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🎂 {selectedMonth}월 생일자
            </DialogTitle>
            {!isLoading && (
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                총 {totalCount}명
              </span>
            )}
          </div>

          {/* 월 선택 pill 탭 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MONTHS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedMonth === m
                    ? "bg-[#2C79FF] text-white shadow-sm scale-105"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {m}월
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 flex-shrink-0" />

        {/* 본문 */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0 scrollbar-transparent-track">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-32" />
                  </div>
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          ) : dayGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🎈</span>
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{selectedMonth}월 생일자가 없습니다</p>
            </div>
          ) : (
            <AnimatedList
              items={rows}
              getKey={(row) => row.key}
              autoHeight
              showGradients={false}
              enableArrowNavigation={false}
              displayScrollbar={false}
              renderItem={(row) => {
                if (row.kind === "header") {
                  return (
                    <div className="flex items-center gap-2 cursor-default">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {selectedMonth}월 {row.day}일
                      </span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                      <span className="text-xs text-gray-400 dark:text-gray-500">{row.count}명</span>
                    </div>
                  );
                }

                if (row.kind === "student") {
                  const s = row.student;
                  return (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-[#F0F5FF] dark:hover:bg-blue-950/40 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-[#2C79FF]/10 dark:bg-[#2C79FF]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#2C79FF]">{s.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{s.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.className}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold flex-shrink-0">
                        학생
                      </span>
                    </div>
                  );
                }

                const t = row.teacher;
                return (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-300">{t.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">선생님</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                      선생님
                    </span>
                  </div>
                );
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
