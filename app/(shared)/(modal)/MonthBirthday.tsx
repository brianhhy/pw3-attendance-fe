"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[85vh] bg-white border-none rounded-3xl p-0 shadow-2xl flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🎂 {selectedMonth}월 생일자
            </DialogTitle>
            {!isLoading && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
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
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {m}월
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 flex-shrink-0" />

        {/* 본문 */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 bg-gray-200 rounded-full w-20" />
                    <div className="h-3 bg-gray-200 rounded-full w-32" />
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : dayGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🎈</span>
              <p className="text-sm font-medium text-gray-400">{selectedMonth}월 생일자가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {dayGroups.map((group) => (
                <div key={group.day}>
                  {/* 날짜 헤더 */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-sm font-bold text-gray-700">
                      {selectedMonth}월 {group.day}일
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">
                      {group.students.length + group.teachers.length}명
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {group.students.map((s) => (
                      <div
                        key={`s-${s.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50 hover:bg-[#F0F5FF] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#2C79FF]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#2C79FF]">{s.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400 truncate">{s.className}</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold flex-shrink-0">
                          학생
                        </span>
                      </div>
                    ))}

                    {group.teachers.map((t) => (
                      <div
                        key={`t-${t.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-purple-600">{t.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                          <p className="text-xs text-gray-400">선생님</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 font-semibold flex-shrink-0">
                          선생님
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
