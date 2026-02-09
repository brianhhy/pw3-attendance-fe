"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import useAttendanceStore from "../(shared)/(store)/attendanceStore";
import { markTeacherAttendance, getTeacherAttendances } from "../(shared)/(api)/attendance";
import Alert from "../(shared)/(modal)/Alert";

export default function TeacherAttendance() {
  const { 
    teachers, 
    getTeachers, 
    selectedDate,
    getAttendances 
  } = useAttendanceStore();
  
  const [attendanceStatuses, setAttendanceStatuses] = useState<{ [key: number]: { status?: string } }>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([getTeachers(), getAttendances()]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getTeachers, getAttendances]);

  useEffect(() => {
    const fetchAndMatchTeacherStatuses = async () => {
      try {
        const attendanceResponse = await getTeacherAttendances(selectedDate);
        
        console.log("출석 상태 API 응답:", attendanceResponse);
        
        const statuses: { [key: number]: { status?: string } } = {};
        
        if (Array.isArray(attendanceResponse)) {
          attendanceResponse.forEach((item: any) => {
            const teacherId = item.teacherId || item.teacher_id || item.id;
            const status = item.status || item.attendanceStatus || item.attendance_status;
            
            if (teacherId) {
              statuses[teacherId] = {
                status: status,
              };
            }
          });
        } else if (attendanceResponse && typeof attendanceResponse === 'object') {
          Object.keys(attendanceResponse).forEach((key) => {
            const item = attendanceResponse[key];
            const teacherId = item?.teacherId || item?.teacher_id || item?.id || Number(key);
            const status = item?.status || item?.attendanceStatus || item?.attendance_status;
            
            if (teacherId) {
              statuses[teacherId] = {
                status: status,
              };
            }
          });
        }
        
        console.log("변환된 출석 상태:", statuses);
        
        setAttendanceStatuses(statuses);
      } catch (error) {
        console.error("선생님 출석 정보 조회 실패:", error);
        setAttendanceStatuses({});
      }
    };

    if (selectedDate && teachers.length > 0) {
      fetchAndMatchTeacherStatuses();
    }
  }, [selectedDate, teachers]);

  const handleAttendanceClick = async (teacherId: number) => {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const attendanceStatus = currentHour < 9 || (currentHour === 9 && currentMinute === 0) ? "ATTEND" : "LATE";

    setAttendanceStatuses(prev => ({
      ...prev,
      [teacherId]: {
        status: attendanceStatus,
      },
    }));

    try {
      await markTeacherAttendance(teacherId, attendanceStatus, selectedDate);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const attendanceResponse = await getTeacherAttendances(selectedDate);
      const statuses: { [key: number]: { status?: string } } = {};
      
      if (Array.isArray(attendanceResponse)) {
        attendanceResponse.forEach((item: any) => {
          const id = item.teacherId || item.teacher_id || item.id;
          if (id) {
            statuses[id] = {
              status: item.status,
            };
          }
        });
      }
      
      setAttendanceStatuses(prev => {
        const updated = { ...prev };
        Object.keys(statuses).forEach(id => {
          const teacherIdNum = Number(id);
          if (statuses[teacherIdNum]?.status) {
            updated[teacherIdNum] = statuses[teacherIdNum];
          }
        });
        if ((!statuses[teacherId] || !statuses[teacherId].status) && prev[teacherId]?.status) {
          updated[teacherId] = prev[teacherId];
        }
        return updated;
      });
      
      await getAttendances();
      
      setAlertType("success");
      setAlertMessage("출석 체크가 완료되었습니다.");
      setAlertOpen(true);
    } catch (error: any) {
      const attendanceResponse = await getTeacherAttendances(selectedDate);
      const statuses: { [key: number]: { status?: string } } = {};
      
      if (Array.isArray(attendanceResponse)) {
        attendanceResponse.forEach((item: any) => {
          const id = item.teacherId || item.teacher_id || item.id;
          if (id) {
            statuses[id] = {
              status: item.status,
            };
          }
        });
      }
      
      setAttendanceStatuses(statuses);
      
      let errorMessage = "출석 체크 중 오류가 발생했습니다.";
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

  const isAttendanceMarked = (teacherId: number) => {
    const status = attendanceStatuses[teacherId];
    if (!status || !status.status) {
      return false;
    }
    
    const statusStr = String(status.status);
    const statusUpper = statusStr.toUpperCase();
    return statusUpper === "ATTEND" || statusUpper === "ATTENDED" || statusUpper === "LATE";
  };

  const getAttendanceStatus = (teacherId: number): "ATTEND" | "LATE" | null => {
    const status = attendanceStatuses[teacherId];
    if (!status || !status.status) {
      return null;
    }
    
    const statusStr = String(status.status);
    const statusUpper = statusStr.toUpperCase();
    
    if (statusUpper === "ATTEND" || statusUpper === "ATTENDED") {
      return "ATTEND";
    } else if (statusUpper === "LATE") {
      return "LATE";
    }
    
    return null;
  };

  const getTeacherDescription = (teacher: { number: string }) => {
    if (!teacher.number) return "담임";
    return `중학교 1학년 ${teacher.number}반 담임`;
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return teacher.name.toLowerCase().includes(query);
  });

  return (
    <div className="h-[710px] w-full max-w-[700px] flex flex-col p-2">
      <div className="flex items-center justify-between mb-6 gap-4 sticky top-0 bg-transparent z-10 pb-2">
        <h2 className="text-2xl font-semibold whitespace-nowrap">선생님 출석</h2>
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
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse"
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-7 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </div>
                <div className="h-12 w-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {searchQuery ? "검색 결과가 없습니다" : "선생님이 없습니다"}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTeachers.map((teacher) => {
              const isMarked = isAttendanceMarked(teacher.id);
              const attendanceStatus = getAttendanceStatus(teacher.id);
              
              return (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-black">
                      {teacher.name}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      {getTeacherDescription(teacher)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAttendanceClick(teacher.id)}
                    disabled={isMarked}
                    className={`px-6 py-3 rounded-lg font-bold text-lg transition-opacity ${
                      isMarked
                        ? attendanceStatus === "ATTEND"
                          ? "bg-[#9EFC9B] text-[#00CB18] cursor-not-allowed"
                          : attendanceStatus === "LATE"
                          ? "bg-[#FCD39B] text-[#F39200] cursor-not-allowed"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#d9d9d9] text-[#697077] hover:opacity-90"
                    }`}
                  >
                    {attendanceStatus === "ATTEND" ? "출석" : attendanceStatus === "LATE" ? "지각" : "출석"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </div>
  );
}

