"use client";

import { useEffect, useMemo, useState } from "react";
import useAttendanceStore from "../../../(shared)/(store)/attendanceStore";
import {
  useStudentAttendanceQuery,
  useMarkStudentAttendance,
  getStudentAttendanceErrorMessage,
} from "../../../(shared)/(hooks)/useStudentAttendance";
import { useAttendanceWebSocket } from "../../../(shared)/(hooks)/useAttendanceWebSocket";
import Alert from "../../../(shared)/(modal)/Alert";
import Search from "../../../(shared)/(components)/Search";
import VoiceSearchButton from "../../../(shared)/(components)/VoiceSearchButton";
import FaceImageHoverPreview from "../../../(shared)/(components)/FaceImageHoverPreview";
import MagicBentoSection from "../../../(shared)/(components)/MagicBentoSection";
import MagicBentoCard from "../../../(shared)/(components)/MagicBentoCard";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(headerSearch.query);
      setHeaderSearch(null);
    }
  }, [headerSearch, setHeaderSearch]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  const { data: classData = [], isLoading } =
    useStudentAttendanceQuery(selectedDate);
  const { mutate: markAttendance } = useMarkStudentAttendance(selectedDate);
  useAttendanceWebSocket(selectedDate);

  const classAttendanceRates = useMemo(() => {
    const map = new Map<string, number>();
    classData.forEach((classItem) => {
      const key = `${classItem.schoolType}-${classItem.grade}-${classItem.classNumber}`;
      const total = classItem.students.length;
      const attendedOrLate = classItem.students.filter(
        (s) => s.status === "attended" || s.status === "late"
      ).length;
      map.set(key, total > 0 ? Math.round((attendedOrLate / total) * 100) : 0);
    });
    return map;
  }, [classData]);

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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">학생 출석</h2>
        <div className="flex items-center gap-2">
          <VoiceSearchButton
            onTranscript={(transcript) => {
              setSearchQuery(transcript);
              setIsSearchOpen(true);
            }}
          />
          <Search
            isOpen={isSearchOpen}
            searchQuery={searchQuery}
            onToggle={() => setIsSearchOpen(!isSearchOpen)}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-transparent-track pr-5">
        <MagicBentoSection enabled glowColor="44, 121, 255">
        <div className="grid grid-cols-1 @[600px]:grid-cols-2 gap-2 pb-4">
          {isLoading ? (
            <div className="col-span-2 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              로딩 중...
            </div>
          ) : filteredClassData.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? "검색 결과가 없습니다" : "반이 없습니다"}
            </div>
          ) : (
            filteredClassData.map((classItem) => (
              <MagicBentoCard
                key={`${classItem.schoolType}-${classItem.grade}-${classItem.classNumber}`}
                glowColor="44, 121, 255"
                className="w-full max-w-[400px] @[600px]:max-w-[560px] mx-auto h-auto @[600px]:h-[450px] bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-bold text-[#5E99FF] truncate">
                    {getSchoolTypeName(classItem.schoolType)}{" "}
                    {classItem.grade}학년 {classItem.classNumber}반
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-[#5E99FF] whitespace-nowrap">
                      담임: {classItem.teacherName}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#9EFC9B] text-[#00CB18] whitespace-nowrap">
                      {classAttendanceRates.get(
                        `${classItem.schoolType}-${classItem.grade}-${classItem.classNumber}`
                      ) ?? 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 scrollbar-transparent-track">
                  <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr>
                        <th className="border-b border-gray-200 dark:border-gray-700 text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          번호
                        </th>
                        <th className="border-b border-gray-200 dark:border-gray-700 text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          이름
                        </th>
                        <th className="border-b border-gray-200 dark:border-gray-700 text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          출석 상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classItem.students.map((student, idx) => (
                        <tr key={student.id}>
                          <td className="border-b border-gray-100 dark:border-gray-800 py-3 px-4 text-sm text-black dark:text-white">{idx + 1}</td>
                          <td className="border-b border-gray-100 dark:border-gray-800 py-3 px-4 text-sm text-black dark:text-white">
                            <FaceImageHoverPreview
                              id={student.id}
                              name={student.name}
                              type="student"
                            />
                          </td>
                          <td className="border-b border-gray-100 dark:border-gray-800 py-3 px-4">
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
                                  : "bg-[#d9d9d9] dark:bg-gray-700 text-[#697077] dark:text-gray-300 hover:opacity-90"
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
              </MagicBentoCard>
            ))
          )}
        </div>
        </MagicBentoSection>
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
