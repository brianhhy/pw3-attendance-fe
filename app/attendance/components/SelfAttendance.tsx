"use client";

import useAttendanceStore from "@/app/(shared)/(store)/attendanceStore";
import { useEffect, useState, useMemo } from "react";
import { User, Check, Clock, ArrowLeft, Search } from "lucide-react";
import AttendanceLogModal from "@/app/(shared)/(modal)/AttendanceLogModal";
import {
  useStudentAttendanceQuery,
  useMarkStudentAttendance,
  getStudentAttendanceErrorMessage,
} from "@/app/(shared)/(hooks)/useStudentAttendance";
import {
  useTeacherAttendanceQuery,
  useMarkTeacherAttendance,
  getTeacherAttendanceErrorMessage,
} from "@/app/(shared)/(hooks)/useTeacherAttendance";

interface RecentSearchItem {
  id: number;
  name: string;
  description: string;
  type: "student" | "teacher";
  status: "before" | "attended" | "late" | "absent";
  time?: string;
}

export default function SelfAttendance() {
  const {
    teachers,
    students,
    getTeachers,
    getStudents,
    selectedItem,
    setSelectedItem,
    selectedDate,
  } = useAttendanceStore();

  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { data: classData = [] } = useStudentAttendanceQuery(selectedDate);
  const { data: attendanceStatuses = {} } =
    useTeacherAttendanceQuery(selectedDate);
  const { mutate: markStudent } = useMarkStudentAttendance(selectedDate);
  const { mutate: markTeacher } = useMarkTeacherAttendance(selectedDate);

  useEffect(() => {
    getTeachers();
    getStudents();
  }, [getTeachers, getStudents]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "오후" : "오전";
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${ampm} ${displayHours}시 ${minutes}분`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem("recentSearchItems");
      if (storedData) setRecentSearches(JSON.parse(storedData));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "recentSearchItems" && e.newValue) {
        try {
          setRecentSearches(JSON.parse(e.newValue));
        } catch {}
      }
    };
    const handleCustomStorageChange = () => {
      try {
        const storedData = localStorage.getItem("recentSearchItems");
        if (storedData) setRecentSearches(JSON.parse(storedData));
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageUpdate", handleCustomStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageUpdate", handleCustomStorageChange);
    };
  }, []);

  const handleAttendanceCheck = () => {
    if (!selectedItem) return;

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const status =
      currentHour < 9 || (currentHour === 9 && currentMinute === 0)
        ? "ATTEND"
        : "LATE";

    if (selectedItem.type === "student") {
      let studentId: number | null = null;
      let studentClassId: number | null = null;

      for (const classItem of classData) {
        const student = classItem.students.find(
          (s) => s.name === selectedItem.name
        );
        if (student) {
          studentId = student.id;
          studentClassId = student.studentClassId ?? null;
          break;
        }
      }

      if (!studentId || !studentClassId) {
        alert("학생 반 정보를 찾을 수 없습니다.");
        return;
      }

      markStudent(
        { studentId, studentClassId, status },
        {
          onSuccess: () => setIsLogModalOpen(true),
          onError: (error) => alert(getStudentAttendanceErrorMessage(error)),
        }
      );
    } else {
      const teacher = teachers.find((t) => t.id === selectedItem.id);
      if (!teacher) {
        alert("선생님 정보를 찾을 수 없습니다.");
        return;
      }

      markTeacher(
        { teacherId: teacher.id, status },
        {
          onSuccess: () => setIsLogModalOpen(true),
          onError: (error) => alert(getTeacherAttendanceErrorMessage(error)),
        }
      );
    }
  };

  const isAttendanceCompleted = useMemo(() => {
    if (!selectedItem) return false;

    if (selectedItem.type === "student") {
      for (const classItem of classData) {
        const student = classItem.students.find(
          (s) => s.name === selectedItem.name
        );
        if (student?.status) return student.status === "attended";
      }
      return false;
    } else {
      const status = attendanceStatuses[selectedItem.id]?.status;
      if (!status) return false;
      const upper = String(status).toUpperCase();
      return upper === "ATTEND" || upper === "ATTENDED";
    }
  }, [selectedItem, classData, attendanceStatuses]);

  const classAttendanceDataForModal = useMemo(
    () =>
      classData.map((c) => ({
        classRoomId: c.id,
        className: c.className,
        teacherName: c.teacherName,
        students: c.students.map((s) => ({
          studentName: s.name,
          studentClassId: s.studentClassId,
          status: s.status ?? null,
        })),
      })),
    [classData]
  );

  const teacherAttendancesForModal = useMemo(
    () =>
      teachers
        .filter((t) => attendanceStatuses[t.id]?.status)
        .map((t) => ({
          teacherId: t.id,
          teacherName: t.name,
          status: attendanceStatuses[t.id]?.status,
        })),
    [teachers, attendanceStatuses]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: RecentSearchItem[] = [];

    students.forEach((student) => {
      if (student.name.toLowerCase().includes(query)) {
        const classes2025 = student.classesByYear?.["2025"];
        let description = "학생";
        if (classes2025 && classes2025.length > 0) {
          const c = classes2025[0];
          const schoolTypeName =
            c.schoolType === "MIDDLE"
              ? "중학교"
              : c.schoolType === "HIGH"
              ? "고등학교"
              : c.schoolType === "ELEMENTARY"
              ? "초등학교"
              : "학교";
          description = `${schoolTypeName} ${c.grade}학년 ${c.classNumber}반 학생`;
        }
        results.push({
          id: student.id,
          name: student.name,
          type: "student",
          description,
          status: "before",
        });
      }
    });

    teachers.forEach((teacher) => {
      if (teacher.name.toLowerCase().includes(query)) {
        results.push({
          id: teacher.id,
          name: teacher.name,
          type: "teacher",
          description: "선생님",
          status: "before",
        });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, students, teachers]);

  const handleSearchResultClick = (result: RecentSearchItem) => {
    setSearchQuery("");
    setIsSearchFocused(false);

    try {
      const existingData = localStorage.getItem("recentSearchItems");
      let recents: RecentSearchItem[] = [];
      if (existingData) {
        try {
          recents = JSON.parse(existingData);
        } catch {
          recents = [];
        }
      }
      recents = recents.filter(
        (item) => !(item.id === result.id && item.type === result.type)
      );
      recents.unshift(result);
      recents = recents.slice(0, 5);
      localStorage.setItem("recentSearchItems", JSON.stringify(recents));
      window.dispatchEvent(new Event("localStorageUpdate"));
      setSelectedItem(result);
    } catch {}
  };

  const getStatusComponent = (item: RecentSearchItem) => {
    switch (item.status) {
      case "before":
        return <span className="text-[#697077]">출석 전</span>;
      case "attended":
        return (
          <div className="flex items-center gap-2 bg-[#9EFC9B] px-3 py-1 rounded-md">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-[#00CB18]" />
            </div>
            <span className="text-[#00CB18]">{item.time}</span>
          </div>
        );
      case "late":
        return (
          <div className="flex items-center gap-2 bg-[#FCD39B] px-3 py-1 rounded-md">
            <Clock className="w-4 h-4 text-[#F39200]" />
            <span className="text-[#F39200]">{item.time}</span>
          </div>
        );
      case "absent":
        return (
          <div className="bg-red-100 px-3 py-1 rounded-md">
            <span className="text-red-500">결석</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col justify-center items-center text-center gap-4">
      {!selectedItem && (
        <div className="w-full max-w-[500px] flex flex-col gap-4 mb-40">
          <div className="flex flex-row items-center justify-between gap-4">
            {recentSearches.length > 0 && (
              <h3 className="text-left text-[#2C79FF] font-medium text-3xl flex-shrink-0">
                최근 검색어
              </h3>
            )}

            <div className="relative flex flex-col min-[1025px]:hidden flex-shrink-0 ml-auto">
              <div
                className={`relative flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
                  isSearchFocused || searchQuery ? "w-[189px]" : "w-10"
                }`}
              >
                <button
                  onClick={() => setIsSearchFocused(true)}
                  className="absolute left-0 z-10 flex items-center justify-center w-8 h-8 text-[#2C79FF] hover:text-[#2C79FF] transition-colors"
                  aria-label="검색"
                >
                  <Search className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="학생명, 선생님 이름 입력"
                  className={`w-full h-[30px] pl-8 pr-1 bg-[#F7F8FF] border-none text-sm focus:outline-none transition-all duration-300 ${
                    isSearchFocused || searchQuery
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                />
              </div>

              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-[42px] left-0 w-full bg-gray-50 border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto mt-1">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-black">
                            {result.name}
                          </span>
                        </div>
                        {result.description && (
                          <span className="text-sm text-gray-500">
                            {result.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-2 bg-transparent">
              {recentSearches.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}-${index}`}
                  onClick={() => setSelectedItem(item)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 flex flex-col items-start">
                    <span className="font-bold text-black">{item.name}</span>
                    <span className="text-sm text-gray-500">
                      {item.description}
                    </span>
                  </div>
                  <div className="flex-shrink-0 ml-20">
                    {getStatusComponent(item)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <div className="flex flex-col max-w-[500px] max-h-[700px] p-6 gap-6 rounded-[15px] bg-purple-100/40 backdrop-blur-md border border-purple-200/50 shadow-lg shadow-purple-200/30">
          <button
            onClick={() => setSelectedItem(null)}
            className="self-start flex items-center gap-1 text-[#697077] hover:text-[#2C79FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">뒤로가기</span>
          </button>
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[40px] font-bold text-black">
              {selectedItem.name}
            </span>
            <span className="text-[30px] font-medium text-[#697077]">
              {selectedItem.description}
            </span>
          </div>
          <div className="flex items-center justify-center">
            {isAttendanceCompleted ? (
              <div className="w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#11998E] to-[#38EF7D] p-[2px] flex-shrink-0 aspect-square">
                <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center gap-4">
                  <span className="text-[48px] font-bold bg-gradient-to-br from-[#11998E] to-[#38EF7D] bg-clip-text text-transparent">
                    {currentTime}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#11998E] to-[#38EF7D] flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[32px] font-medium bg-gradient-to-br from-[#11998E] to-[#38EF7D] bg-clip-text text-transparent">
                    출석 완료
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-[400px] h-[400px] bg-white rounded-full border-[1px] border-[#D7E2ED] flex flex-col items-center justify-center gap-4 flex-shrink-0 aspect-square">
                <span className="text-[48px] font-bold text-[#697077]">
                  {currentTime}
                </span>
                <span className="text-[32px] font-medium text-[#697077]">
                  출석 전
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleAttendanceCheck}
            disabled={isAttendanceCompleted}
            className={`w-[400px] h-[60px] ${
              isAttendanceCompleted
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-[#0AB81E] hover:opacity-90"
            } font-medium text-[30px] rounded-[10px] transition-opacity`}
          >
            {isAttendanceCompleted ? "출석 완료" : "출석 체크하기"}
          </button>
        </div>
      )}

      <AttendanceLogModal
        open={isLogModalOpen}
        onOpenChange={setIsLogModalOpen}
        selectedDate={selectedDate}
        classAttendanceData={classAttendanceDataForModal}
        teacherAttendances={teacherAttendancesForModal}
      />
    </div>
  );
}
