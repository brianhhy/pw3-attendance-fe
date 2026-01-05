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

  useEffect(() => {
    getTeachers();
    getAttendances();
  }, [getTeachers, getAttendances]);

  useEffect(() => {
    // 선생님 리스트와 출석 상태를 매칭
    const fetchAndMatchTeacherStatuses = async () => {
      try {
        // 1. 선생님 리스트는 이미 store에서 가져옴 (teachers)
        // 2. 출석 상태 조회
        const attendanceResponse = await getTeacherAttendances(selectedDate);
        
        console.log("출석 상태 API 응답:", attendanceResponse);
        
        // 3. 출석 상태를 teacherId를 키로 하는 객체로 변환
        const statuses: { [key: number]: { status?: string } } = {};
        
        if (Array.isArray(attendanceResponse)) {
          attendanceResponse.forEach((item: any) => {
            // teacherId 필드명이 다를 수 있으므로 여러 가능성 확인
            const teacherId = item.teacherId || item.teacher_id || item.id;
            const status = item.status || item.attendanceStatus || item.attendance_status;
            
            if (teacherId) {
              statuses[teacherId] = {
                status: status,
              };
            }
          });
        } else if (attendanceResponse && typeof attendanceResponse === 'object') {
          // 배열이 아닌 객체인 경우 처리
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
        
        // 4. 선생님 리스트의 각 선생님과 출석 상태 매칭
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
      // 현재 시간에 따라 출석 상태 결정 (오전 9시 이전: ATTEND, 9시 이후: LATE)
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const attendanceStatus = currentHour < 9 || (currentHour === 9 && currentMinute === 0) ? "ATTEND" : "LATE";

    // Optimistic update: 즉시 UI에 반영
    setAttendanceStatuses(prev => ({
      ...prev,
      [teacherId]: {
        status: attendanceStatus,
      },
    }));

    try {
      await markTeacherAttendance(teacherId, attendanceStatus, selectedDate);
      
      // 출석 상태 다시 조회하여 선생님 리스트와 매칭 (서버 동기화)
      // 약간의 지연을 주어 서버가 업데이트를 반영할 시간을 줌
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
      
      // 서버 응답이 있으면 서버 데이터로 업데이트, 없으면 기존 상태 유지
      setAttendanceStatuses(prev => {
        const updated = { ...prev };
        // 서버 응답에 있는 항목만 업데이트 (기존 상태는 유지)
        Object.keys(statuses).forEach(id => {
          const teacherIdNum = Number(id);
          if (statuses[teacherIdNum]?.status) {
            updated[teacherIdNum] = statuses[teacherIdNum];
          }
        });
        // 클릭한 선생님의 경우 서버 응답이 없거나 빈 값이면 optimistic update 유지
        if ((!statuses[teacherId] || !statuses[teacherId].status) && prev[teacherId]?.status) {
          updated[teacherId] = prev[teacherId];
        }
        return updated;
      });
      
      // store도 업데이트 (다른 컴포넌트 동기화용)
      await getAttendances();
      
      setAlertType("success");
      setAlertMessage("출석 체크가 완료되었습니다.");
      setAlertOpen(true);
    } catch (error: any) {
      // 에러 발생 시 이전 상태로 롤백
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

  // 검색어에 따라 필터링된 선생님 목록
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return teacher.name.toLowerCase().includes(query);
  });

  return (
    <div className="h-[710px] w-[566px] flex flex-col p-2">
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
        {filteredTeachers.length === 0 ? (
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
                  {/* 왼쪽: 이름과 직책 정보 */}
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-black">
                      {teacher.name}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      {getTeacherDescription(teacher)}
                    </span>
                  </div>

                  {/* 오른쪽: 출석 버튼 */}
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

