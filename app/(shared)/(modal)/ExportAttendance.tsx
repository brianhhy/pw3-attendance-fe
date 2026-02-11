"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportAttendanceSummary } from "../(api)/attendance";
import useAttendanceStore from "../(store)/attendanceStore";
import { Copy, Check } from "lucide-react";
import Search from "../(components)/Search";

interface ExportAttendanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportAttendance({ open, onOpenChange }: ExportAttendanceProps) {
  const { selectedDate } = useAttendanceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldAnimate(true);
      fetchAttendanceData();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setShouldAnimate(false);
      setAttendanceData(null);
      setCopied(false);
      setSearchQuery("");
      setIsSearchOpen(false);
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
    if (searchQuery) {
      textContent += `검색어: ${searchQuery}\n\n`;
    }

    // 학년 순서 정렬 (중1, 중2, 중3, 고1, 고2, 고3)
    const getGradeOrder = (className: string) => {
      if (!className) return 999;
      
      // 중학교 확인
      if (className.includes('중')) {
        if (className.includes('1')) return 1;
        if (className.includes('2')) return 2;
        if (className.includes('3')) return 3;
      }
      
      // 고등학교 확인
      if (className.includes('고')) {
        if (className.includes('1')) return 4;
        if (className.includes('2')) return 5;
        if (className.includes('3')) return 6;
      }
      
      return 999;
    };

    // classAttendances 배열 처리
    if (attendanceData && typeof attendanceData === 'object' && Array.isArray(attendanceData.classAttendances)) {
      const sortedClassAttendances = [...attendanceData.classAttendances].sort((a: any, b: any) => {
        return getGradeOrder(a.classRoomName || "") - getGradeOrder(b.classRoomName || "");
      });

      sortedClassAttendances.forEach((item: any) => {
        // status가 null이 아닌 학생만 필터링
        if (item.students && Array.isArray(item.students)) {
          const filteredStudents = item.students.filter((student: any) => {
            const status = student.status;
            const hasStatus = status !== null && status !== undefined && status !== "";
            
            // 검색어가 있으면 이름 필터링
            if (searchQuery) {
              const studentName = student.studentName || student.name || "";
              return hasStatus && studentName.toLowerCase().includes(searchQuery.toLowerCase());
            }
            
            return hasStatus;
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
          const hasStatus = status !== null && status !== undefined && status !== "";
          
          // 검색어가 있으면 이름 필터링
          if (searchQuery) {
            const teacherName = teacher.teacherName || teacher.name || "";
            return hasStatus && teacherName.toLowerCase().includes(searchQuery.toLowerCase());
          }
          
          return hasStatus;
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

    // 출석한 학생이 있는지 확인
    const hasAttendedStudents = attendanceData.classAttendances.some((classItem: any) => {
      const filteredStudents = classItem.students?.filter((student: any) => {
        const status = student.status;
        return status !== null && status !== undefined && status !== "";
      }) || [];
      return filteredStudents.length > 0;
    });

    const hasAttendedTeachers = attendanceData.teacherAttendances?.some((teacher: any) => {
      const status = teacher.status;
      return status !== null && status !== undefined && status !== "";
    }) || false;

    if (!hasAttendedStudents && !hasAttendedTeachers) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="mb-6 opacity-50">
            <Image 
              src="/images/logo.png" 
              alt="logo" 
              width={171} 
              height={80}
            />
          </div>
          <p className="text-gray-500 text-lg">
            오늘 출석한 인원이 없습니다.
          </p>
        </div>
      );
    }

    // 학년 순서 정렬 (중1, 중2, 중3, 고1, 고2, 고3)
    const getGradeOrder = (className: string) => {
      if (!className) return 999;
      
      // 중학교 확인
      if (className.includes('중')) {
        if (className.includes('1')) return 1;
        if (className.includes('2')) return 2;
        if (className.includes('3')) return 3;
      }
      
      // 고등학교 확인
      if (className.includes('고')) {
        if (className.includes('1')) return 4;
        if (className.includes('2')) return 5;
        if (className.includes('3')) return 6;
      }
      
      return 999;
    };

    const sortedClassAttendances = [...attendanceData.classAttendances].sort((a: any, b: any) => {
      return getGradeOrder(a.classRoomName || "") - getGradeOrder(b.classRoomName || "");
    });

    return (
      <div className="space-y-6">
        {/* 반별 출석 정보 */}
        {sortedClassAttendances.map((classItem: any, index: number) => {
          const filteredStudents = classItem.students?.filter((student: any) => {
            const status = student.status;
            const hasStatus = status !== null && status !== undefined && status !== "";
            
            // 검색어가 있으면 이름 필터링
            if (searchQuery) {
              const studentName = student.studentName || student.name || "";
              return hasStatus && studentName.toLowerCase().includes(searchQuery.toLowerCase());
            }
            
            return hasStatus;
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
            const hasStatus = status !== null && status !== undefined && status !== "";
            
            // 검색어가 있으면 이름 필터링
            if (searchQuery) {
              const teacherName = teacher.teacherName || teacher.name || "";
              return hasStatus && teacherName.toLowerCase().includes(searchQuery.toLowerCase());
            }
            
            return hasStatus;
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
      <DialogContent 
        showCloseButton={true}
        className={`sm:max-w-2xl sm:h-[80vh] bg-white border-none flex flex-col ${
          shouldAnimate ? "animate-slide-up" : ""
        }`}
      >
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between pr-12">
            <DialogTitle>출석부 - {selectedDate}</DialogTitle>
            <Search
              isOpen={isSearchOpen}
              searchQuery={searchQuery}
              onToggle={() => setIsSearchOpen(!isSearchOpen)}
              onSearchChange={setSearchQuery}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {renderAttendanceContent()}
        </div>

        {/* 클립보드 복사 버튼 - 오른쪽 아래 고정 */}
        <button
          onClick={handleCopyToClipboard}
          disabled={isLoading || !attendanceData}
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
