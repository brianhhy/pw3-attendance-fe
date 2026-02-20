"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAttendanceReport } from "../(api)/attendance";
import useAttendanceStore from "../(store)/attendanceStore";
import { Copy, Check } from "lucide-react";
import Search from "../(components)/Search";

interface ClassSection {
  name: string;
  students: string[];
}

interface AttendanceReport {
  rawText: string;
  date: string;
  studentCount: string;
  teacherCount: string;
  classes: ClassSection[];
}

interface ExportAttendanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseReport(text: string): AttendanceReport {
  const lines = text.split("\n");
  const result: AttendanceReport = {
    rawText: text,
    date: "",
    studentCount: "",
    teacherCount: "",
    classes: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^\d{4}[.\-/]\d{2}[.\-/]\d{2}/.test(trimmed)) {
      result.date = trimmed;
    } else if (trimmed.startsWith("학생:")) {
      result.studentCount = trimmed.replace("학생:", "").trim();
    } else if (trimmed.startsWith("선생님")) {
      result.teacherCount = trimmed.split(":")[1]?.trim() ?? "";
    } else if (trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const className = trimmed.slice(0, colonIdx).trim();
      const studentsStr = trimmed.slice(colonIdx + 1).trim();
      if (studentsStr) {
        const students = studentsStr.split(",").map((s) => s.trim()).filter(Boolean);
        result.classes.push({ name: className, students });
      }
    }
  }

  return result;
}

function getGradeOrder(className: string) {
  const m = className.match(/^(중|고)\s*(\d)/);
  if (!m) return 999;
  return (m[1] === "중" ? 0 : 3) + parseInt(m[2]);
}

export default function ExportAttendance({ open, onOpenChange }: ExportAttendanceProps) {
  const { selectedDate } = useAttendanceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<AttendanceReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldAnimate(true);
      fetchReport();
    } else {
      setShouldAnimate(false);
      setReportData(null);
      setCopied(false);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  }, [open, selectedDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const text = await getAttendanceReport(selectedDate);
      setReportData(parseReport(text));
    } catch (error) {
      console.error("출석부 조회 실패:", error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredClasses = () => {
    if (!reportData) return [];
    const sorted = [...reportData.classes].sort(
      (a, b) => getGradeOrder(a.name) - getGradeOrder(b.name)
    );
    if (!searchQuery) return sorted;
    return sorted
      .map((cls) => ({
        ...cls,
        students: cls.students.filter((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((cls) => cls.students.length > 0);
  };

  const handleCopyToClipboard = async () => {
    if (!reportData) return;

    let text: string;
    if (searchQuery) {
      const filtered = getFilteredClasses();
      text = `${reportData.date}\n학생: ${reportData.studentCount}\n선생님 (헬퍼포함): ${reportData.teacherCount}\n\n`;
      filtered.forEach((cls) => {
        text += `${cls.name}: ${cls.students.join(", ")}\n`;
      });
    } else {
      text = reportData.rawText;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center text-gray-500 py-8">
          출석 데이터를 불러올 수 없습니다.
        </div>
      );
    }

    const filteredClasses = getFilteredClasses();

    if (filteredClasses.length === 0 && !searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="mb-6 opacity-50">
            <Image src="/images/logo.png" alt="logo" width={171} height={80} />
          </div>
          <p className="text-gray-500 text-lg">오늘 출석한 인원이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {/* 요약 헤더 */}
        {(reportData.studentCount || reportData.teacherCount) && (
          <div className="flex gap-4 mb-4 text-sm text-gray-500">
            {reportData.studentCount && <span>학생 {reportData.studentCount}</span>}
            {reportData.teacherCount && <span>선생님 (헬퍼포함) {reportData.teacherCount}</span>}
          </div>
        )}

        {filteredClasses.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            검색 결과가 없습니다.
          </p>
        ) : (
          filteredClasses.map((cls, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-base mb-2">{cls.name}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {cls.students.map((student, j) => (
                  <span key={j} className="text-sm text-gray-700">
                    {student}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className={`sm:max-w-2xl sm:h-[80vh] bg-white border-none flex flex-col ${
          shouldAnimate ? "animate-slide-up" : ""
        }`}
      >
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between pr-12">
            <DialogTitle>{selectedDate} 출석부</DialogTitle>
            <Search
              isOpen={isSearchOpen}
              searchQuery={searchQuery}
              onToggle={() => setIsSearchOpen(!isSearchOpen)}
              onSearchChange={setSearchQuery}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">{renderContent()}</div>

        <button
          onClick={handleCopyToClipboard}
          disabled={isLoading || !reportData}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-[#2C79FF] text-white rounded-lg hover:bg-[#2C79FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm">클립보드에 복사</span>
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
