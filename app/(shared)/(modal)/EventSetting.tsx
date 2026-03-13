"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Check, ChevronDown, Trash2 } from "lucide-react";

const LOCAL_STORAGE_KEY = "pw3_event";

const EVENT_TYPES = [
  { value: "parents_observation", label: "부모님 참관 수업" },
];

interface SavedEvent {
  date: string;
  type: string;
}

interface EventSettingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EventSetting({ open, onOpenChange }: EventSettingProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState(EVENT_TYPES[0].value);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    if (open) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSavedEvents(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          setSavedEvents([]);
        }
      } else {
        setSavedEvents([]);
      }
      setSelectedDate("");
      setSelectedType(EVENT_TYPES[0].value);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedDate) return;
    const newEvent: SavedEvent = { date: selectedDate, type: selectedType };
    const updated = [...savedEvents.filter((e) => e.date !== selectedDate), newEvent];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSavedEvents(updated);
    setSelectedDate("");
    setSelectedType(EVENT_TYPES[0].value);
  };

  const handleDelete = (date: string) => {
    const updated = savedEvents.filter((e) => e.date !== date);
    if (updated.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
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
        className="sm:max-w-sm bg-white border-none"
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
              <p className="text-xs text-gray-500">저장된 이벤트</p>
              {savedEvents
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((event) => (
                  <div
                    key={event.date}
                    className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2C79FF]">
                        {formatDisplayDate(event.date)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {getTypeLabel(event.type)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(event.date)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="이벤트 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">이벤트 유형</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2C79FF] focus:border-transparent"
              >
                <span>{EVENT_TYPES.find((t) => t.value === selectedType)?.label}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "" : "rotate-180"}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => { setSelectedType(type.value); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
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
            <label className="text-sm font-medium text-gray-700">날짜 선택</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C79FF] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
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
