"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportAttendanceSummary } from "../(api)/attendance";
import useAttendanceStore from "../(store)/attendanceStore";
import { Copy, Check } from "lucide-react";

interface ExportAttendanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportAttendance({ open, onOpenChange }: ExportAttendanceProps) {
  const { selectedDate } = useAttendanceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAttendanceData();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setAttendanceData(null);
      setCopied(false);
    }
  }, [open, selectedDate]);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const schoolYear = new Date(selectedDate).getFullYear();
      const data = await exportAttendanceSummary(selectedDate, schoolYear);
      setAttendanceData(data);
    } catch (error) {
      console.error("출석부 조회 실패:", error);
      setAttendanceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAttendanceText = () => {
    if (!attendanceData) return "";

    let textContent = `출석부 - ${selectedDate}\n\n`;

    // classAttendances 배열 처리
    if (attendanceData && typeof attendanceData === 'object' && Array.isArray(attendanceData.classAttendances)) {
      attendanceData.classAttendances.forEach((item: any) => {
        // status가 null이 아닌 학생만 필터링
        if (item.students && Array.isArray(item.students)) {
          const filteredStudents = item.students.filter((student: any) => {
            const status = student.status;
            return status !== null && status !== undefined && status !== "";
          });

          // 필터링된 학생이 있는 경우에만 반 정보 추가
          if (filteredStudents.length > 0) {
            if (item.classRoomName) {
              textContent += `반: ${item.classRoomName}\n`;
            }
            if (item.teacherName) {
              textContent += `담임: ${item.teacherName}\n`;
            }
            textContent += "학생 목록:\n";
            filteredStudents.forEach((student: any, idx: number) => {
              const status = student.status === "ATTEND" ? "출석"
                : student.status === "LATE" ? "지각"
                  : student.status === "ABSENT" ? "결석"
                    : student.status === "OTHER" ? "기타"
                      : "미체크";
              textContent += `  ${idx + 1}. ${student.studentName || student.name} - ${status}\n`;
            });
            textContent += "\n";
          }
        }
      });

      // teacherAttendances 배열 처리 (status가 null이 아닌 선생님만)
      if (attendanceData.teacherAttendances && Array.isArray(attendanceData.teacherAttendances)) {
        const filteredTeachers = attendanceData.teacherAttendances.filter((teacher: any) => {
          const status = teacher.status;
          return status !== null && status !== undefined && status !== "";
        });

        if (filteredTeachers.length > 0) {
          textContent += "선생님 출석:\n";
          filteredTeachers.forEach((teacher: any, idx: number) => {
            const status = teacher.status === "ATTEND" ? "출석"
              : teacher.status === "LATE" ? "지각"
                : teacher.status === "ABSENT" ? "결석"
                  : teacher.status === "OTHER" ? "기타"
                    : "미체크";
            textContent += `  ${idx + 1}. ${teacher.teacherName || teacher.name} - ${status}\n`;
          });
        }
      }
    }

    return textContent;
  };

  const handleCopyToClipboard = async () => {
    const text = formatAttendanceText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
    }
  };

  const renderAttendanceContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!attendanceData) {
      return (
        <div className="text-center text-gray-500 py-8">
          출석 데이터를 불러올 수 없습니다.
        </div>
      );
    }

    const hasData = attendanceData.classAttendances && attendanceData.classAttendances.length > 0;

    if (!hasData) {
      return (
        <div className="text-center text-gray-500 py-8">
          출석 데이터가 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 반별 출석 정보 */}
        {attendanceData.classAttendances.map((classItem: any, index: number) => {
          const filteredStudents = classItem.students?.filter((student: any) => {
            const status = student.status;
            return status !== null && status !== undefined && status !== "";
          }) || [];

          if (filteredStudents.length === 0) return null;

          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">
                {classItem.classRoomName}
              </h3>
              {classItem.teacherName && (
                <p className="text-sm text-gray-600 mb-3">
                  담임: {classItem.teacherName}
                </p>
              )}
              <div className="space-y-1">
                <p className="text-sm font-semibold mb-2">학생 목록:</p>
                {filteredStudents.map((student: any, idx: number) => {
                  const status = student.status === "ATTEND" ? "출석"
                    : student.status === "LATE" ? "지각"
                      : student.status === "ABSENT" ? "결석"
                        : student.status === "OTHER" ? "기타"
                          : "미체크";
                  const statusColor = student.status === "ATTEND" ? "text-green-600"
                    : student.status === "LATE" ? "text-orange-600"
                      : student.status === "ABSENT" ? "text-red-600"
                        : "text-gray-600";

                  return (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span>{idx + 1}. {student.studentName || student.name}</span>
                      <span className={`font-medium ${statusColor}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 선생님 출석 정보 */}
        {attendanceData.teacherAttendances && attendanceData.teacherAttendances.length > 0 && (() => {
          const filteredTeachers = attendanceData.teacherAttendances.filter((teacher: any) => {
            const status = teacher.status;
            return status !== null && status !== undefined && status !== "";
          });

          if (filteredTeachers.length === 0) return null;

          return (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">선생님 출석</h3>
              <div className="space-y-1">
                {filteredTeachers.map((teacher: any, idx: number) => {
                  const status = teacher.status === "ATTEND" ? "출석"
                    : teacher.status === "LATE" ? "지각"
                      : teacher.status === "ABSENT" ? "결석"
                        : teacher.status === "OTHER" ? "기타"
                          : "미체크";
                  const statusColor = teacher.status === "ATTEND" ? "text-green-600"
                    : teacher.status === "LATE" ? "text-orange-600"
                      : teacher.status === "ABSENT" ? "text-red-600"
                        : "text-gray-600";

                  return (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span>{idx + 1}. {teacher.teacherName || teacher.name}</span>
                      <span className={`font-medium ${statusColor}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white border-none flex flex-col">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>출석부 - {selectedDate}</DialogTitle>
            <button
              onClick={handleCopyToClipboard}
              disabled={isLoading || !attendanceData}
              className="flex items-center gap-2 px-4 py-2 bg-[#2C79FF] text-white rounded-lg hover:bg-[#2C79FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {renderAttendanceContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
