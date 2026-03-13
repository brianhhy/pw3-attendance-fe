"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Trash2 } from "lucide-react";

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
  const [savedEvent, setSavedEvent] = useState<SavedEvent | null>(null);

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed: SavedEvent = JSON.parse(stored);
          setSavedEvent(parsed);
          setSelectedDate(parsed.date);
          setSelectedType(parsed.type);
        } catch {
          setSavedEvent(null);
        }
      } else {
        setSavedEvent(null);
        setSelectedDate("");
        setSelectedType(EVENT_TYPES[0].value);
      }
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedDate) return;
    const event: SavedEvent = { date: selectedDate, type: selectedType };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(event));
    setSavedEvent(event);
    onOpenChange(false);
  };

  const handleClear = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSavedEvent(null);
    setSelectedDate("");
    setSelectedType(EVENT_TYPES[0].value);
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
          {savedEvent && (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">현재 저장된 이벤트</p>
                <p className="text-sm font-semibold text-[#2C79FF]">
                  {formatDisplayDate(savedEvent.date)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getTypeLabel(savedEvent.type)}
                </p>
              </div>
              <button
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="이벤트 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">이벤트 유형</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C79FF] focus:border-transparent bg-white"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate}
              className="flex-1 py-2.5 rounded-lg bg-[#2C79FF] text-sm font-medium text-white hover:bg-[#2C79FF]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
