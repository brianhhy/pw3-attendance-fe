"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getBirthdays } from "@/app/(shared)/(api)/birth";
import { queryKeys } from "@/app/(shared)/(api)/queryKeys";

const MonthBirthday = dynamic(() => import("@/app/(shared)/(modal)/MonthBirthday"), { ssr: false });

interface BirthdayEntry {
  name: string;
  label: string;
  day: number;
  month: number;
  birthYear: number;
}

const toEntries = (data: Awaited<ReturnType<typeof getBirthdays>>, month: number): BirthdayEntry[] => [
  ...data.students.map((s) => ({ name: s.name, label: s.className, day: s.birth[2], month, birthYear: s.birth[0] })),
  ...data.teachers.map((t) => ({ name: t.name, label: "선생님", day: t.birth[2], month, birthYear: t.birth[0] })),
];

export default function UpcomingBirthdays() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: currentData, isLoading: isCurrentLoading } = useQuery({
    queryKey: queryKeys.birthdays(currentMonth),
    queryFn: () => getBirthdays(currentMonth),
  });

  const hasUpcoming = useMemo(() => {
    if (!currentData) return false;
    return toEntries(currentData, currentMonth).some((e) => e.day >= currentDay);
  }, [currentData]);

  const { data: nextData, isLoading: isNextLoading } = useQuery({
    queryKey: queryKeys.birthdays(nextMonth),
    queryFn: () => getBirthdays(nextMonth),
    enabled: !!currentData && !hasUpcoming,
  });

  const entries = useMemo<BirthdayEntry[]>(() => {
    if (!currentData) return [];
    const upcoming = toEntries(currentData, currentMonth)
      .filter((e) => e.day >= currentDay)
      .sort((a, b) => a.day - b.day)
      .slice(0, 3);
    if (upcoming.length > 0) return upcoming;
    if (!nextData) return [];
    return toEntries(nextData, nextMonth).sort((a, b) => a.day - b.day).slice(0, 3);
  }, [currentData, nextData]);

  const isLoading = isCurrentLoading || (!hasUpcoming && isNextLoading);

  const formatDate = (month: number, day: number) => {
    const t = new Date();
    if (month === t.getMonth() + 1 && day === t.getDate()) return "오늘";
    if (month === t.getMonth() + 1 && day === t.getDate() + 1) return "내일";
    return `${month}월 ${day}일`;
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🎂 다가오는 생일
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">이번 달 생일을 맞이하는 사람들</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            생일 모두 보기
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-4 bg-gray-200 rounded-full w-24" />
                  <div className="h-3 bg-gray-200 rounded-full w-16" />
                </div>
                <div className="h-6 w-14 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">다가오는 생일이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <div
                key={`${entry.name}-${entry.month}-${entry.day}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                  🎂
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{entry.name}</p>
                  <p className="text-xs text-gray-400">{entry.label}</p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                  {formatDate(entry.month, entry.day)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MonthBirthday open={isModalOpen} onOpenChange={setIsModalOpen} initialMonth={currentMonth} />
    </>
  );
}
