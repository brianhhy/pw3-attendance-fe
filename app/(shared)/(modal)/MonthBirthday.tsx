"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getBirthdays, BirthdayStudent, BirthdayTeacher } from "../(api)/birth";

interface MonthBirthdayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonth?: number; // 1~12
}

interface DayGroup {
  day: number;
  students: BirthdayStudent[];
  teachers: BirthdayTeacher[];
}

export default function MonthBirthday({ open, onOpenChange, initialMonth }: MonthBirthdayProps) {
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => initialMonth ?? new Date().getMonth() + 1);

  useEffect(() => {
    if (open && initialMonth != null) {
      setSelectedMonth(initialMonth);
    } else if (open) {
      setSelectedMonth(new Date().getMonth() + 1);
    }
  }, [open, initialMonth]);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    getBirthdays(selectedMonth)
      .then((data) => {
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

        setDayGroups(Array.from(map.values()).sort((a, b) => a.day - b.day));
      })
      .catch(() => setDayGroups([]))
      .finally(() => setIsLoading(false));
  }, [open, selectedMonth]);

  const totalCount = dayGroups.reduce(
    (acc, g) => acc + g.students.length + g.teachers.length,
    0
  );

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] bg-white border-none rounded-2xl p-0 shadow-xl flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-pink-50 to-blue-50 px-6 pt-5 pb-5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 shrink-0">
              <span className="text-2xl">🎂</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm focus:border-[#2C79FF] focus:outline-none focus:ring-1 focus:ring-[#2C79FF]"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
              <span>생일자</span>
            </DialogTitle>
          </div>
          {!isLoading && (
            <p className="text-xs text-gray-400 mt-1">
              총 <span className="font-semibold text-[#2C79FF]">{totalCount}</span>명
            </p>
          )}
        </div>

        {/* 본문 */}
        <div className="px-6 py-4 flex-1 overflow-y-auto rounded-b-2xl min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#2C79FF] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">불러오는 중...</span>
              </div>
            </div>
          ) : dayGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-3xl">🎈</span>
              <p className="text-sm text-gray-400">{selectedMonth}월 생일자가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {dayGroups.map((group) => (
                <div key={group.day}>
                  {/* 날짜 구분선 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-500">{selectedMonth}월 {group.day}일</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {/* 학생 */}
                    {group.students.map((s) => (
                      <div
                        key={`s-${s.id}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🎂</span>
                          <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#2C79FF]/10 text-[#2C79FF] font-medium whitespace-nowrap">
                            {s.className}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                            학생
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* 선생님 */}
                    {group.teachers.map((t) => (
                      <div
                        key={`t-${t.id}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-50/60 hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🎂</span>
                          <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">
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
