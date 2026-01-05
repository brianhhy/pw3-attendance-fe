"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import { markStudentAttendance, markTeacherAttendance, getStudentAttendances, getTeacherAttendances } from "../../(shared)/(api)/attendance";
import Alert from "../../(shared)/(modal)/Alert";

interface AttendanceItem {
  id: number;
  name: string;
  type: "student" | "teacher";
  status: "ATTEND" | "LATE" | "ABSENT" | "OTHER" | null;
  studentClassId?: number;
  teacherId?: number;
  className?: string;
  date: string;
}

// 학교 타입을 한글로 변환
const getSchoolTypeName = (schoolType: string): string => {
  switch (schoolType) {
    case "MIDDLE":
      return "중";
    case "HIGH":
      return "고";
    case "ELEMENTARY":
      return "초";
    default:
      return "학교";
  }
};

// 상태를 한글로 변환
const getStatusName = (status: string | null): string => {
  if (!status) return "-";
  switch (status.toUpperCase()) {
    case "ATTEND":
      return "출석";
    case "LATE":
      return "지각";
    case "ABSENT":
      return "결석";
    case "OTHER":
      return "기타";
    default:
      return status;
  }
};

// 상태에 따른 색상
const getStatusColor = (status: string | null): string => {
  if (!status) return "bg-gray-100 text-gray-600";
  switch (status.toUpperCase()) {
    case "ATTEND":
      return "bg-[#9EFC9B] text-[#00CB18]";
    case "LATE":
      return "bg-[#FCD39B] text-[#F39200]";
    case "ABSENT":
      return "bg-[#FCD5D5] text-[#F65656]";
    case "OTHER":
      return "bg-[#B3CFFF] text-[#2C79FF]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function AttendanceManagement() {
  const { selectedDate, getAttendances } = useAttendanceStore();
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        const schoolYear = 2026;
        
        // 학생과 선생님 출석 정보 가져오기
        const [studentAttendances, teacherAttendances] = await Promise.all([
          getStudentAttendances(schoolYear, selectedDate),
          getTeacherAttendances(selectedDate),
        ]);

        const items: AttendanceItem[] = [];

        // 학생 출석 정보 처리
        if (Array.isArray(studentAttendances)) {
          studentAttendances.forEach((classItem: any) => {
            const classRoomId = classItem.classRoomId || classItem.class_room_id;
            const className = classItem.className || `${classItem.grade}학년 ${classItem.classNumber}반`;
            
            if (classItem.students && Array.isArray(classItem.students)) {
              classItem.students.forEach((student: any) => {
                const studentClassId = student.studentClassId || student.student_class_id;
                const status = student.status;
                
                // UNCHECKED가 아닌 경우만 추가
                if (status && status.toUpperCase() !== "UNCHECKED") {
                  items.push({
                    id: student.studentId || student.student_id || student.id || studentClassId,
                    name: student.studentName || student.student_name || student.name,
                    type: "student",
                    status: status.toUpperCase() as "ATTEND" | "LATE" | "ABSENT" | "OTHER",
                    studentClassId: studentClassId,
                    className: className,
                    date: selectedDate,
                  });
                }
              });
            }
          });
        }

        // 선생님 출석 정보 처리
        if (Array.isArray(teacherAttendances)) {
          teacherAttendances.forEach((teacher: any) => {
            const teacherId = teacher.teacherId || teacher.teacher_id || teacher.id;
            const status = teacher.status || teacher.attendanceStatus || teacher.attendance_status;
            
            // UNCHECKED가 아닌 경우만 추가
            if (status && status.toUpperCase() !== "UNCHECKED") {
              items.push({
                id: teacherId,
                name: teacher.teacherName || teacher.teacher_name || teacher.name,
                type: "teacher",
                status: status.toUpperCase() as "ATTEND" | "LATE" | "ABSENT" | "OTHER",
                teacherId: teacherId,
                date: selectedDate,
              });
            }
          });
        }

        setAttendanceItems(items);
      } catch (error) {
        console.error("출석 정보 조회 실패:", error);
        setAttendanceItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
    getAttendances();
  }, [selectedDate, getAttendances]);

  // 검색어에 따라 필터링
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return attendanceItems;
    }

    const query = searchQuery.toLowerCase();
    return attendanceItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [attendanceItems, searchQuery]);

  const handleStatusChange = async (
    item: AttendanceItem,
    newStatus: "ATTEND" | "LATE" | "ABSENT" | "OTHER"
  ) => {
    try {
      if (item.type === "student" && item.studentClassId) {
        await markStudentAttendance(item.studentClassId, selectedDate, newStatus);
      } else if (item.type === "teacher" && item.teacherId) {
        await markTeacherAttendance(item.teacherId, newStatus, selectedDate);
      }

      // 출석 정보 다시 가져오기
      const schoolYear = 2026;
      const [studentAttendances, teacherAttendances] = await Promise.all([
        getStudentAttendances(schoolYear, selectedDate),
        getTeacherAttendances(selectedDate),
      ]);

      const items: AttendanceItem[] = [];

      // 학생 출석 정보 처리
      if (Array.isArray(studentAttendances)) {
        studentAttendances.forEach((classItem: any) => {
          const classRoomId = classItem.classRoomId || classItem.class_room_id;
          const className = classItem.className || `${classItem.grade}학년 ${classItem.classNumber}반`;
          
          if (classItem.students && Array.isArray(classItem.students)) {
            classItem.students.forEach((student: any) => {
              const studentClassId = student.studentClassId || student.student_class_id;
              const status = student.status;
              
              if (status && status.toUpperCase() !== "UNCHECKED") {
                items.push({
                  id: student.studentId || student.student_id || student.id || studentClassId,
                  name: student.studentName || student.student_name || student.name,
                  type: "student",
                  status: status.toUpperCase() as "ATTEND" | "LATE" | "ABSENT" | "OTHER",
                  studentClassId: studentClassId,
                  className: className,
                  date: selectedDate,
                });
              }
            });
          }
        });
      }

      // 선생님 출석 정보 처리
      if (Array.isArray(teacherAttendances)) {
        teacherAttendances.forEach((teacher: any) => {
          const teacherId = teacher.teacherId || teacher.teacher_id || teacher.id;
          const status = teacher.status || teacher.attendanceStatus || teacher.attendance_status;
          
          if (status && status.toUpperCase() !== "UNCHECKED") {
            items.push({
              id: teacherId,
              name: teacher.teacherName || teacher.teacher_name || teacher.name,
              type: "teacher",
              status: status.toUpperCase() as "ATTEND" | "LATE" | "ABSENT" | "OTHER",
              teacherId: teacherId,
              date: selectedDate,
            });
          }
        });
      }

      setAttendanceItems(items);
      await getAttendances();

      setAlertType("success");
      setAlertMessage("출석 상태가 변경되었습니다.");
      setAlertOpen(true);
    } catch (error: any) {
      console.error("출석 상태 변경 실패:", error);
      
      let errorMessage = "출석 상태 변경 중 오류가 발생했습니다.";
      if (error.response?.status === 400) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error || "잘못된 요청입니다.";
        errorMessage = `잘못된 요청입니다: ${serverMessage}`;
      } else if (error.response?.status === 500) {
        errorMessage = "서버 오류가 발생했습니다. 날짜가 올바른지 확인해주세요.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertType("error");
      setAlertMessage(errorMessage);
      setAlertOpen(true);
    }
  };

  return (
    <div className="w-full max-w-[800px] bg-transparent p-3">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">출석 관리</h1>
        <div
          className={`relative flex items-center overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
            isSearchOpen ? "w-64" : "w-10"
          }`}
        >
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </button>
          <Input
            placeholder="이름을 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 bg-gray-50 border-none transition-all duration-300 ${
              isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        </div>
      </div>

      <div className="rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">구분</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">이름</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">반/직책</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">현재 상태</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    {searchQuery ? "검색 결과가 없습니다" : "출석 정보가 없습니다."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr 
                    key={`${item.type}-${item.id || item.studentClassId || item.teacherId || index}`} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 1 ? "bg-[#F7F8FF]" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.type === "student" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {item.type === "student" ? "학생" : "선생님"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.className || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold inline-block ${getStatusColor(item.status)}`}>
                        {getStatusName(item.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={item.status === "ATTEND" ? "default" : "outline"}
                          onClick={() => handleStatusChange(item, "ATTEND")}
                          className={`text-xs ${
                            item.status === "ATTEND"
                              ? "bg-[#9EFC9B] text-[#00CB18] border-[#9EFC9B] hover:bg-[#8EEB8B]"
                              : "border-none hover:bg-[#9EFC9B] hover:text-[#00CB18]"
                          }`}
                        >
                          출석
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "LATE" ? "default" : "outline"}
                          onClick={() => handleStatusChange(item, "LATE")}
                          className={`text-xs ${
                            item.status === "LATE"
                              ? "bg-[#FCD39B] text-[#F39200] border-[#FCD39B] hover:bg-[#ECC38B]"
                              : "border-none hover:bg-[#FCD39B] hover:text-[#F39200]"
                          }`}
                        >
                          지각
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "ABSENT" ? "default" : "outline"}
                          onClick={() => handleStatusChange(item, "ABSENT")}
                          className={`text-xs ${
                            item.status === "ABSENT"
                              ? "bg-[#FCD5D5] text-[#F65656] border-[#FCD5D5] hover:bg-[#FCC5C5]"
                              : "border-none hover:bg-[#FCD5D5] hover:text-[#F65656]"
                          }`}
                        >
                          결석
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "OTHER" ? "default" : "outline"}
                          onClick={() => handleStatusChange(item, "OTHER")}
                          className={`text-xs ${
                            item.status === "OTHER"
                              ? "bg-[#B3CFFF] text-[#2C79FF] border-[#B3CFFF] hover:bg-[#A3BFFF]"
                              : "border-none hover:bg-[#B3CFFF] hover:text-[#2C79FF]"
                          }`}
                        >
                          기타
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert 모달 */}
      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </div>
  );
}

