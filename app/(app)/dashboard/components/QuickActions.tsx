"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Send, Users, CalendarDays, BarChart2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SpotlightCard from "@/app/(shared)/(components)/SpotlightCard";

const MatchingModal = dynamic(() => import("@/app/(shared)/(modal)/MatchingModal"), { ssr: false });
const ExportAttendance = dynamic(() => import("@/app/(shared)/(modal)/ExportAttendance"), { ssr: false });
const EventSetting = dynamic(() => import("@/app/(shared)/(modal)/EventSetting"), { ssr: false });

type ActionKey = "export" | "matching" | "event" | "report";

interface CardConfig {
  key: ActionKey;
  icon: LucideIcon;
  title: string;
  desc: string;
  disabled?: boolean;
}

const cards: CardConfig[] = [
  { key: "report",   icon: BarChart2,   title: "월별 출석 보고서", desc: "저장된 보고서를 확인하세요" },
  { key: "export",   icon: Send,        title: "출석부 보내기",   desc: "오늘 출석 현황을 공유하세요" },
  { key: "matching", icon: Users,       title: "반 배정하기",     desc: "학생·선생님을 반에 배정하세요" },
  { key: "event",    icon: CalendarDays, title: "이벤트 설정",    desc: "특별 일정을 등록하세요" },
];

export default function QuickActions() {
  const router = useRouter();
  const [open, setOpen] = useState<ActionKey | null>(null);

  const handleActionClick = (key: ActionKey, disabled?: boolean) => {
    if (disabled) return;
    if (key === "report") {
      router.push("/monthly-report");
      return;
    }
    setOpen(key);
  };

  return (
    <>
      <div className="h-full">
        <div className="grid grid-cols-2 gap-3 h-full">
          {cards.map(({ key, icon: Icon, title, desc, disabled }) => (
            <SpotlightCard
              key={key}
              className={`h-full ${disabled ? "opacity-50" : ""}`}
              spotlightColor="rgba(44, 121, 255, 0.15)"
            >
              <button
                onClick={() => handleActionClick(key, disabled)}
                disabled={disabled}
                className={`w-full h-full rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 text-center transition-colors ${
                  disabled ? "cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                }`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Icon className={`w-6 h-6 ${disabled ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                </div>
              </button>
            </SpotlightCard>
          ))}
        </div>
      </div>

      <ExportAttendance open={open === "export"} onOpenChange={(v) => !v && setOpen(null)} />
      <MatchingModal open={open === "matching"} onOpenChange={(v) => !v && setOpen(null)} />
      <EventSetting open={open === "event"} onOpenChange={(v) => !v && setOpen(null)} />
    </>
  );
}
