"use client";

import { useEffect, useState } from "react";
import useAttendanceStore from "../(shared)/(store)/attendanceStore";
import { markTeacherAttendance, getTeacherAttendances } from "../(shared)/(api)/attendance";
import Alert from "../(shared)/(modal)/Alert";
import Search from "../(shared)/(components)/Search";

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

  // 컴포넌트 마운트 시 선생님 목록과 출석 데이터를 초기 로드한다.
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

  // 선택된 날짜 또는 선생님 목록이 변경될 때 출석 상태를 다시 조회하여 매핑한다.
  useEffect(() => {
    const fetchAndMatchTeacherStatuses = async () => {
      try {
        const attendanceResponse = await getTeacherAttendances(selectedDate);

        const statuses: { [key: number]: { status?: string } } = {};

        if (Array.isArray(attendanceResponse)) {
          attendanceResponse.forEach((item: any) => {
            const teacherId = item.teacherId || item.teacher_id || item.id;
            const status = item.status || item.attendanceStatus || item.attendance_status;

            if (teacherId) {
              statuses[teacherId] = { status };
            }
          });
        } else if (attendanceResponse && typeof attendanceResponse === 'object') {
          Object.keys(attendanceResponse).forEach((key) => {
            const item = attendanceResponse[key];
            const teacherId = item?.teacherId || item?.teacher_id || item?.id || Number(key);
            const status = item?.status || item?.attendanceStatus || item?.attendance_status;

            if (teacherId) {
              statuses[teacherId] = { status };
            }
          });
        }

        setAttendanceStatuses(statuses);
      } catch (error) {
        setAttendanceStatuses({});
      }
    };

    if (selectedDate && teachers.length > 0) {
      setAttendanceStatuses({});
      fetchAndMatchTeacherStatuses();
    }
  }, [selectedDate, teachers]);

  // 출석 버튼 클릭 시 9시 이전이면 출석, 이후면 지각으로 처리하고 서버에 반영한다.
  const handleAttendanceClick = async (teacherId: number) => {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const attendanceStatus = currentHour < 9 || (currentHour === 9 && currentMinute === 0) ? "ATTEND" : "LATE";

    setAttendanceStatuses(prev => ({
      ...prev,
      [teacherId]: { status: attendanceStatus },
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
            statuses[id] = { status: item.status };
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
            statuses[id] = { status: item.status };
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

  // 선생님의 출석 또는 지각 여부를 반환한다.
  const isAttendanceMarked = (teacherId: number) => {
    const status = attendanceStatuses[teacherId];
    if (!status || !status.status) return false;

    const statusUpper = String(status.status).toUpperCase();
    return statusUpper === "ATTEND" || statusUpper === "ATTENDED" || statusUpper === "LATE";
  };

  // 선생님의 출석 상태를 "ATTEND" | "LATE" | null로 반환한다.
  const getAttendanceStatus = (teacherId: number): "ATTEND" | "LATE" | null => {
    const status = attendanceStatuses[teacherId];
    if (!status || !status.status) return null;

    const statusUpper = String(status.status).toUpperCase();
    if (statusUpper === "ATTEND" || statusUpper === "ATTENDED") return "ATTEND";
    if (statusUpper === "LATE") return "LATE";
    return null;
  };

  // 학교 유형 코드를 한국어 이름으로 변환한다.
  const getSchoolTypeName = (schoolType: string) => {
    if (schoolType === "MIDDLE") return "중학교";
    if (schoolType === "HIGH") return "고등학교";
    if (schoolType === "ELEMENTARY") return "초등학교";
    return schoolType;
  };

  // 선생님이 담당하는 반 정보를 "OO학교 O학년 O반 담임" 형식의 문자열로 반환한다.
  const getTeacherDescription = (teacher: { classesByYear?: { [year: string]: { schoolType: string; grade: number; classNumber: number }[] } }) => {
    const classes = teacher.classesByYear?.["2026"];
    if (!classes || classes.length === 0) return "담임";
    return classes
      .map((c) => `${getSchoolTypeName(c.schoolType)} ${c.grade}학년 ${c.classNumber}반 담임`)
      .join(", ");
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return teacher.name.toLowerCase().includes(query);
  });

  return (
    <div className="h-[710px] w-full flex flex-col p-2">
      <div className="flex items-center justify-between mb-6 gap-4 sticky top-0 bg-transparent z-10 pb-2">
        <h2 className="text-2xl font-semibold whitespace-nowrap">선생님 출석</h2>
        <Search
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onToggle={() => setIsSearchOpen(!isSearchOpen)}
          onSearchChange={setSearchQuery}
        />
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
                  className="flex items-center justify-between p-3 xl:p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex flex-col min-w-0 mr-2">
                    <span className="text-lg xl:text-2xl font-bold text-black truncate">
                      {teacher.name}
                    </span>
                    <span className="text-xs xl:text-sm text-gray-500 mt-1 truncate">
                      {getTeacherDescription(teacher)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAttendanceClick(teacher.id)}
                    disabled={isMarked}
                    className={`flex-shrink-0 px-3 xl:px-6 py-2 xl:py-3 rounded-lg font-bold text-base xl:text-lg transition-opacity ${
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
