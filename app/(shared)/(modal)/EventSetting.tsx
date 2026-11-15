"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Check, ChevronDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { readEvents, saveEvents, type SavedEvent } from "@/lib/events";

const EVENT_TYPES = [
  { value: "parents_observation", label: "부모님 참관 수업" },
  { value: "friend_invitation", label: "친구초청예배" },
];

interface EventSettingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EventSetting({ open, onOpenChange }: EventSettingProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState(EVENT_TYPES[0].value);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShouldAnimate(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      setSavedEvents(readEvents());
      setSaveError("");
      setSelectedDate("");
      setSelectedType(EVENT_TYPES[0].value);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedDate) return;
    const newEvent: SavedEvent = { date: selectedDate, type: selectedType };
    const updated = [...savedEvents.filter((e) => e.date !== selectedDate || e.type !== selectedType), newEvent];
    try {
      saveEvents(updated);
    } catch {
      setSaveError("이벤트를 저장하지 못했습니다. 브라우저의 저장 공간 설정을 확인해주세요.");
      return;
    }
    setSaveError("");
    setSavedEvents(updated);
    setSelectedDate("");
    setSelectedType(EVENT_TYPES[0].value);
  };

  const handleDelete = (date: string, type: string) => {
    const updated = savedEvents.filter((e) => e.date !== date || e.type !== type);
    try {
      saveEvents(updated);
    } catch {
      setSaveError("이벤트를 삭제하지 못했습니다. 다시 시도해주세요.");
      return;
    }
    setSaveError("");
    setSavedEvents(updated);
  };

  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${year}년 ${month}월 ${day}일`;
  };

  const getTypeLabel = (value: string) =>
    EVENT_TYPES.find((t) => t.value === value)?.label ?? value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className={`content-start overflow-y-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-sm bg-white dark:bg-gray-900 border-none ${shouldAnimate ? "animate-slide-up" : ""}`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#2C79FF]" />
            이벤트 설정
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {savedEvents.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">저장된 이벤트</p>
              {savedEvents
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((event) => (
                  <div
                    key={`${event.date}-${event.type}`}
                    className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2C79FF]">
                        {formatDisplayDate(event.date)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {getTypeLabel(event.type)}
                      </p>
                      {event.type === "friend_invitation" && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#2C79FF]">
                          <Link href="/new-friends/register" onClick={() => onOpenChange(false)} className="hover:underline">새친구 등록</Link>
                          <Link href="/new-friends" onClick={() => onOpenChange(false)} className="hover:underline">등록된 친구 보기</Link>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(event.date, event.type)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                      aria-label="이벤트 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="event-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">이벤트 유형</label>
            <div className="relative" ref={dropdownRef}>
              <button
                id="event-type"
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2C79FF] focus:border-transparent"
              >
                <span>{EVENT_TYPES.find((t) => t.value === selectedType)?.label}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${dropdownOpen ? "" : "rotate-180"}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => { setSelectedType(type.value); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <span>{type.label}</span>
                      {selectedType === type.value && <Check className="w-4 h-4 text-[#2C79FF]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="event-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">날짜 선택</label>
            <input
              id="event-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#2C79FF] focus:border-transparent"
            />
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">이벤트 설정은 현재 브라우저에 저장됩니다.</p>
          {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate}
              className="flex-1 py-2.5 rounded-lg bg-[#2C79FF] text-sm font-medium text-white hover:bg-[#2C79FF]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
