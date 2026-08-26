"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};

const getDaysInMonth = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getFirstDayOfMonth = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), 1).getDay();

// 날짜 하나만 고르는 팝업 캘린더. 미래 날짜는 선택할 수 없다.
export default function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date(value));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setViewMonth(new Date(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (day: number) => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth() + 1;
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    nextMonthStart.setHours(0, 0, 0, 0);

    if (nextMonthStart <= today) {
      setViewMonth(nextMonth);
    }
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getFullYear() === viewMonth.getFullYear() &&
      today.getMonth() === viewMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number): boolean => {
    const selected = new Date(value);
    return (
      selected.getFullYear() === viewMonth.getFullYear() &&
      selected.getMonth() === viewMonth.getMonth() &&
      selected.getDate() === day
    );
  };

  const isFuture = (day: number): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const daysInMonth = getDaysInMonth(viewMonth);
  const firstDay = getFirstDayOfMonth(viewMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const future = isFuture(day);
    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !future && handleSelect(day)}
        disabled={future}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
          future
            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            : isSelected(day)
            ? "bg-[#2C79FF] text-white font-bold"
            : isToday(day)
            ? "bg-gray-200 dark:bg-gray-700 font-semibold text-gray-900 dark:text-gray-100"
            : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        {day}
      </button>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  const isNextMonthFuture = nextMonth > today;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Calendar className="w-4 h-4 text-[#2C79FF]" />
        <span className="text-sm font-medium text-[#2C79FF] whitespace-nowrap">{formatDate(value)}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-[999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-[250px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-100" />
            </button>
            <span className="font-bold text-base text-gray-900 dark:text-gray-100">
              {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isNextMonthFuture}
              className={`p-1 rounded ${
                isNextMonthFuture ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <ChevronRight className="w-4 h-4 text-gray-900 dark:text-gray-100" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
      )}
    </div>
  );
}
