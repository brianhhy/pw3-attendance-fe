"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

interface AttendanceLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  classAttendanceData: any[];
  teacherAttendances: any[];
}

export default function AttendanceLogModal({
  open,
  onOpenChange,
  selectedDate,
  classAttendanceData,
  teacherAttendances,
}: AttendanceLogModalProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [open]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  const getStatusText = (status: string | null): string => {
    if (!status) return "미체크";
    const statusUpper = status.toUpperCase();
    if (statusUpper === "ATTEND" || statusUpper === "ATTENDED") return "출석";
    if (statusUpper === "LATE") return "지각";
    if (statusUpper === "ABSENT") return "결석";
    if (statusUpper === "OTHER") return "기타";
    return status;
  };

  const getStatusColor = (status: string | null): string => {
    if (!status) return "text-gray-500";
    const statusUpper = status.toUpperCase();
    if (statusUpper === "ATTEND" || statusUpper === "ATTENDED") return "text-[#00CB18]";
    if (statusUpper === "LATE") return "text-[#F39200]";
    if (statusUpper === "ABSENT") return "text-[#F65656]";
    return "text-gray-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[600px] max-h-[80vh] border bg-white shadow-xl rounded-2xl p-0 overflow-hidden transition-all duration-300 ease-out border-blue-100 ${
        shouldAnimate 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      }`}>
        <div className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-[#2C79FF] text-center mb-2">
            출석 로그
          </DialogTitle>
          <div className="text-center text-gray-600 mb-4">
            {formatDate(selectedDate)}
          </div>
        </div>

        <div className="px-6 pb-4 flex-1 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* 학생 출석 로그 */}
          {(() => {
            // status가 null이 아닌 학생만 필터링
            const filteredClassData = classAttendanceData
              ?.map((classItem: any) => {
                if (!classItem.students || !Array.isArray(classItem.students)) return null;
                
                const filteredStudents = classItem.students.filter((student: any) => {
                  const status = student.status;
                  return status !== null && status !== undefined && status !== "";
                });
                
                if (filteredStudents.length === 0) return null;
                
                return {
                  ...classItem,
                  students: filteredStudents,
                };
              })
              .filter((item: any) => item !== null) || [];

            return filteredClassData.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#2C79FF]" />
                  학생 출석
                </h3>
                <div className="space-y-4">
                  {filteredClassData.map((classItem: any, classIndex: number) => (
                    <div key={classItem.classRoomId || classIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="font-semibold text-gray-900 mb-2">
                        {classItem.className || `반 ${classIndex + 1}`}
                      </div>
                      {classItem.teacherName && (
                        <div className="text-sm text-gray-600 mb-3">
                          담임: {classItem.teacherName}
                        </div>
                      )}
                      <div className="space-y-1">
                        {classItem.students.map((student: any, idx: number) => (
                          <div key={student.studentClassId || idx} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                            <span className="text-sm text-gray-700">{student.studentName || student.name}</span>
                            <span className={`text-sm font-medium ${getStatusColor(student.status)}`}>
                              {getStatusText(student.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* 선생님 출석 로그 */}
          {(() => {
            // status가 null이 아닌 선생님만 필터링
            const filteredTeachers = teacherAttendances?.filter((teacher: any) => {
              const status = teacher.status || teacher.attendanceStatus || teacher.attendance_status;
              return status !== null && status !== undefined && status !== "";
            }) || [];

            return filteredTeachers.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#2C79FF]" />
                  선생님 출석
                </h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-1">
                    {filteredTeachers.map((teacher: any, idx: number) => {
                      const teacherId = teacher.teacherId || teacher.teacher_id || teacher.id;
                      const teacherName = teacher.teacherName || teacher.name;
                      const status = teacher.status || teacher.attendanceStatus || teacher.attendance_status;
                      
                      return (
                        <div key={teacherId || idx} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-700">{teacherName}</span>
                          <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {(() => {
            // 필터링된 학생과 선생님이 모두 없는 경우
            const filteredClassData = classAttendanceData
              ?.map((classItem: any) => {
                if (!classItem.students || !Array.isArray(classItem.students)) return null;
                const filteredStudents = classItem.students.filter((student: any) => {
                  const status = student.status;
                  return status !== null && status !== undefined && status !== "";
                });
                return filteredStudents.length > 0 ? classItem : null;
              })
              .filter((item: any) => item !== null) || [];

            const filteredTeachers = teacherAttendances?.filter((teacher: any) => {
              const status = teacher.status || teacher.attendanceStatus || teacher.attendance_status;
              return status !== null && status !== undefined && status !== "";
            }) || [];

            return filteredClassData.length === 0 && filteredTeachers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                출석 로그가 없습니다.
              </div>
            ) : null;
          })()}
        </div>

        <DialogFooter className="px-6 pb-6 flex flex-row !justify-center">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-8 py-2.5 bg-[#2C79FF] text-white hover:bg-[#2568E6] transition-colors rounded-lg"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
