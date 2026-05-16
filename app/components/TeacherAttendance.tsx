"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAttendanceStore from "../(shared)/(store)/attendanceStore";
import {
  useTeacherAttendanceQuery,
  useMarkTeacherAttendance,
  getTeacherAttendanceStatus,
  isTeacherAttendanceMarked,
  getTeacherAttendanceErrorMessage,
} from "../(shared)/(hooks)/useTeacherAttendance";
import { getTeacherList } from "../(shared)/(api)/teacher";
import { queryKeys } from "../(shared)/(api)/queryKeys";
import Alert from "../(shared)/(modal)/Alert";
import Search from "../(shared)/(components)/Search";

export default function TeacherAttendance() {
  const { selectedDate } = useAttendanceStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  const { data: teachers = [], isPending: isLoading } = useQuery<{ id: number; name: string; status: string; number: string; classesByYear?: { [year: string]: { schoolType: string; grade: number; classNumber: number }[] } }[]>({
    queryKey: queryKeys.teachersList(),
    queryFn: getTeacherList,
  });

  const { data: attendanceStatuses = {} } =
    useTeacherAttendanceQuery(selectedDate);
  const { mutate: markAttendance } = useMarkTeacherAttendance(selectedDate);

  const handleAttendanceClick = (teacherId: number) => {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const status =
      currentHour < 9 || (currentHour === 9 && currentMinute === 0)
        ? "ATTEND"
        : "LATE";

    markAttendance(
      { teacherId, status },
      {
        onSuccess: () => {
          setAlertType("success");
          setAlertMessage("출석 체크가 완료되었습니다.");
          setAlertOpen(true);
        },
        onError: (error) => {
          setAlertType("error");
          setAlertMessage(getTeacherAttendanceErrorMessage(error));
          setAlertOpen(true);
        },
      }
    );
  };

  const getSchoolTypeName = (schoolType: string) => {
    if (schoolType === "MIDDLE") return "중학교";
    if (schoolType === "HIGH") return "고등학교";
    if (schoolType === "ELEMENTARY") return "초등학교";
    return schoolType;
  };

  const getTeacherDescription = (teacher: {
    classesByYear?: {
      [year: string]: { schoolType: string; grade: number; classNumber: number }[];
    };
  }) => {
    const classes = teacher.classesByYear?.["2026"];
    if (!classes || classes.length === 0) return "담임";
    return classes
      .map(
        (c) =>
          `${getSchoolTypeName(c.schoolType)} ${c.grade}학년 ${c.classNumber}반 담임`
      )
      .join(", ");
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery.trim()) return true;
    return teacher.name.toLowerCase().includes(searchQuery.toLowerCase());
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
              const isMarked = isTeacherAttendanceMarked(
                attendanceStatuses,
                teacher.id
              );
              const attendanceStatus = getTeacherAttendanceStatus(
                attendanceStatuses,
                teacher.id
              );

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
                    {attendanceStatus === "ATTEND"
                      ? "출석"
                      : attendanceStatus === "LATE"
                      ? "지각"
                      : "출석"}
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
