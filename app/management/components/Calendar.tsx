"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import { getBirthdays, BirthdayStudent, BirthdayTeacher } from "../../(shared)/(api)/birth";

interface CalendarProps {
  onSelect?: () => void;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface BirthdayMap {
  [day: number]: { students: BirthdayStudent[]; teachers: BirthdayTeacher[] };
}

export default function Calendar({ onSelect }: CalendarProps) {
  const { selectedDate, setSelectedDate } = useAttendanceStore();

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [birthdayMap, setBirthdayMap] = useState<BirthdayMap>({});
  const [tooltipDay, setTooltipDay] = useState<number | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  useEffect(() => {
    const month = viewMonth + 1;
    getBirthdays(month)
      .then((data) => {
        const map: BirthdayMap = {};
        data.students.forEach((s) => {
          const day = s.birth[2];
          if (!map[day]) map[day] = { students: [], teachers: [] };
          map[day].students.push(s);
        });
        data.teachers.forEach((t) => {
          const day = t.birth[2];
          if (!map[day]) map[day] = { students: [], teachers: [] };
          map[day].teachers.push(t);
        });
        setBirthdayMap(map);
      })
      .catch(() => {
        setBirthdayMap({});
      });
  }, [viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    setSelectedDate(dateStr);
    onSelect?.();
  };

  return (
    <div className="w-[620px] select-none">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-white/60 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-400" />
        </button>
        <span className="text-2xl font-bold text-gray-700">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-white/60 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`text-center text-sm font-semibold py-2 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-[#2C79FF]" : "text-gray-400"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-200/60 mb-3" />

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dow = (firstDay + i) % 7;
          const bday = birthdayMap[day];
          const hasBirthday = !!bday;
          const totalBirthdays = hasBirthday
            ? bday.students.length + bday.teachers.length
            : 0;

          return (
            <div key={day} className="relative flex flex-col items-center">
              <button
                onClick={() => handleDayClick(day)}
                className={`mx-auto my-1 w-16 h-16 flex flex-col items-center justify-center text-base rounded-xl transition-all duration-150 ${
                  isSelected
                    ? "bg-[#2C79FF] text-white font-bold shadow-lg scale-110"
                    : isToday
                    ? "bg-white text-[#2C79FF] font-bold shadow-sm ring-2 ring-[#2C79FF]/30"
                    : dow === 0
                    ? "text-red-400 hover:bg-white/70"
                    : dow === 6
                    ? "text-[#2C79FF] hover:bg-white/70"
                    : "text-gray-600 hover:bg-white/70"
                }`}
                onMouseEnter={() => hasBirthday && setTooltipDay(day)}
                onMouseLeave={() => setTooltipDay(null)}
              >
                <span>{day}</span>
                <span className={`block text-[9px] mt-0.5 min-h-[14px] font-semibold leading-tight flex items-center justify-center ${isSelected ? "text-white/90" : "text-pink-400"}`}>
                  {hasBirthday ? `🎂${totalBirthdays}` : "\u00A0"}
                </span>
              </button>

              {/* 생일 툴팁 */}
              {tooltipDay === day && hasBirthday && (
                <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 min-w-[160px] max-w-[220px]">
                  <p className="text-xs font-bold text-gray-500 mb-2">{viewMonth + 1}월 {day}일 생일</p>
                  {bday.students.length > 0 && (
                    <div className="mb-1.5">
                      <p className="text-[10px] font-semibold text-[#2C79FF] mb-1">학생</p>
                      {bday.students.map((s) => (
                        <p key={s.id} className="text-xs text-gray-700 leading-tight">
                          {s.name} <span className="text-gray-400 text-[10px]">({s.className})</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {bday.teachers.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-purple-500 mb-1">선생님</p>
                      {bday.teachers.map((t) => (
                        <p key={t.id} className="text-xs text-gray-700 leading-tight">
                          {t.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
