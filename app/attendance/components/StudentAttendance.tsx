"use client";

import { useEffect, useMemo, useState } from "react";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import {
  useStudentAttendanceQuery,
  useMarkStudentAttendance,
  getStudentAttendanceErrorMessage,
} from "../../(shared)/(hooks)/useStudentAttendance";
import { useAttendanceWebSocket } from "../../(shared)/(hooks)/useAttendanceWebSocket";
import Alert from "../../(shared)/(modal)/Alert";
import Search from "../../(shared)/(components)/Search";

const getSchoolTypeName = (schoolType: string): string => {
  switch (schoolType) {
    case "MIDDLE":
      return "중학교";
    case "HIGH":
      return "고등학교";
    case "ELEMENTARY":
      return "초등학교";
    default:
      return "학교";
  }
};

export default function StudentAttendance() {
  const { selectedDate, headerSearch, setHeaderSearch } = useAttendanceStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (headerSearch?.type === "student") {
      setSearchQuery(headerSearch.query);
      setHeaderSearch(null);
    }
  }, [headerSearch]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  const { data: classData = [], isLoading } =
    useStudentAttendanceQuery(selectedDate);
  const { mutate: markAttendance } = useMarkStudentAttendance(selectedDate);
  useAttendanceWebSocket(selectedDate);

  const filteredClassData = useMemo(() => {
    if (!searchQuery.trim()) return classData;
    const query = searchQuery.toLowerCase();
    return classData
      .map((classItem) => {
        const filteredStudents = classItem.students.filter((student) =>
          student.name.toLowerCase().includes(query)
        );
        if (filteredStudents.length === 0) return null;
        return { ...classItem, students: filteredStudents };
      })
      .filter((classItem) => classItem !== null);
  }, [classData, searchQuery]);

  const handleAttendanceClick = (studentId: number, studentClassId: number) => {
    const currentHour = new Date().getHours();
    const status = currentHour < 9 ? "ATTEND" : "LATE";

    markAttendance(
      { studentId, studentClassId, status },
      {
        onSuccess: () => {
          setAlertType("success");
          setAlertMessage("출석 체크가 완료되었습니다.");
          setAlertOpen(true);
        },
        onError: (error) => {
          setAlertType("error");
          setAlertMessage(getStudentAttendanceErrorMessage(error));
          setAlertOpen(true);
        },
      }
    );
  };

  const handleAbsenceClick = (studentId: number, studentClassId: number) => {
    markAttendance({ studentId, studentClassId, status: "ABSENT" });
  };

  return (
    <div className="w-full h-[710px] flex flex-col p-2 @container">
      <div className="flex items-center justify-between mb-6 gap-4 sticky top-0 bg-transparent z-10 pb-2">
        <h2 className="text-2xl font-semibold whitespace-nowrap">학생 출석</h2>
        <Search
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onToggle={() => setIsSearchOpen(!isSearchOpen)}
          onSearchChange={setSearchQuery}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 @[600px]:grid-cols-2 gap-2 pb-4">
          {isLoading ? (
            <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
              로딩 중...
            </div>
          ) : filteredClassData.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
              {searchQuery ? "검색 결과가 없습니다" : "반이 없습니다"}
            </div>
          ) : (
            filteredClassData.map((classItem) => (
              <div
                key={`${classItem.schoolType}-${classItem.grade}-${classItem.classNumber}`}
                className="w-full max-w-[400px] @[600px]:max-w-none mx-auto h-auto @[600px]:h-[450px] bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#5E99FF]">
                    {getSchoolTypeName(classItem.schoolType)}{" "}
                    {classItem.grade}학년 {classItem.classNumber}반
                  </h3>
                  <span className="text-sm text-[#5E99FF]">
                    담임: {classItem.teacherName}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          번호
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          이름
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          출석 상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classItem.students.map((student, idx) => (
                        <tr key={student.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm">{idx + 1}</td>
                          <td className="py-3 px-4 text-sm">{student.name}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                handleAttendanceClick(
                                  student.id,
                                  student.studentClassId ||
                                    classItem.id ||
                                    0
                                )
                              }
                              disabled={
                                student.status === "attended" ||
                                student.status === "late"
                              }
                              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-opacity ${
                                student.status === "attended"
                                  ? "bg-[#9EFC9B] text-[#00CB18] cursor-not-allowed"
                                  : student.status === "late"
                                  ? "bg-[#FCD39B] text-[#F39200] cursor-not-allowed"
                                  : "bg-[#d9d9d9] text-[#697077] hover:opacity-90"
                              }`}
                            >
                              {student.status === "attended"
                                ? "출석"
                                : student.status === "late"
                                ? "지각"
                                : "출석"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
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
