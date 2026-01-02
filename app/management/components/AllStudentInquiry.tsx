"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import { markStudentAttendance } from "../../(shared)/(api)/attendance";

interface ClassData {
  schoolType: string;
  grade: number;
  classNumber: number;
  className: string;
  teacherName: string;
  students: Array<{
    id: number;
    name: string;
    status?: "attended" | "late" | "absent";
  }>;
}

// 학교 타입을 한글로 변환
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

export default function AllStudentInquiry() {
  const { students, teachers, studentAttendances, selectedDate, getStudents, getTeachers, getAttendances } = useAttendanceStore();
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getStudents();
    getTeachers();
    getAttendances();
  }, []);

  useEffect(() => {
    if (students.length === 0) return;

    // 현재 연도 (2025)
    const currentYear = "2025";
    
    // 반별로 학생 그룹화
    const groupedByClass: { [key: string]: ClassData } = {};

    students.forEach((student) => {
      // 2025년 클래스 정보 가져오기
      const classes2025 = student.classesByYear?.[currentYear];
      if (!classes2025 || classes2025.length === 0) return;

      // 첫 번째 클래스 정보 사용 (보통 학생은 한 반에만 속함)
      const classInfo = classes2025[0];
      const key = `${classInfo.schoolType}-${classInfo.grade}-${classInfo.classNumber}`;
      
      if (!groupedByClass[key]) {
        // 담임 선생님 찾기 (classNumber로 찾기)
        const teacher = teachers.find((t) => t.number === String(classInfo.classNumber));
        groupedByClass[key] = {
          schoolType: classInfo.schoolType,
          grade: classInfo.grade,
          classNumber: classInfo.classNumber,
          className: classInfo.name,
          teacherName: teacher?.name || "담임 미지정",
          students: [],
        };
      }

      // 출석 상태 확인
      const attendance = studentAttendances.find(
        (a) => a.studentId === student.id && a.date === selectedDate
      );

      groupedByClass[key].students.push({
        id: student.id,
        name: student.name,
        status: attendance?.status,
      });
    });

    // 반별로 정렬 (중학교 우선 > 학년 > 반 순서)
    const sortedClasses = Object.values(groupedByClass).sort((a, b) => {
      // 학교 타입 우선순위: MIDDLE > ELEMENTARY > HIGH
      const getSchoolTypePriority = (schoolType: string): number => {
        if (schoolType === "MIDDLE") return 1;
        if (schoolType === "ELEMENTARY") return 2;
        if (schoolType === "HIGH") return 3;
        return 4;
      };
      
      const priorityA = getSchoolTypePriority(a.schoolType);
      const priorityB = getSchoolTypePriority(b.schoolType);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 학교 타입이면 학년 순서
      if (a.grade !== b.grade) {
        return a.grade - b.grade;
      }
      
      // 같은 학년이면 반 순서
      return a.classNumber - b.classNumber;
    });

    setClassData(sortedClasses);
  }, [students, teachers, studentAttendances, selectedDate]);

  // 검색어에 따라 필터링된 클래스 데이터
  const filteredClassData = useMemo(() => {
    if (!searchQuery.trim()) {
      return classData;
    }

    const query = searchQuery.toLowerCase();
    return classData
      .map((classItem) => {
        // 각 반의 학생 중 검색어와 일치하는 학생만 필터링
        const filteredStudents = classItem.students.filter((student) =>
          student.name.toLowerCase().includes(query)
        );

        // 필터링된 학생이 있는 반만 반환
        if (filteredStudents.length === 0) {
          return null;
        }

        return {
          ...classItem,
          students: filteredStudents,
        };
      })
      .filter((classItem): classItem is ClassData => classItem !== null);
  }, [classData, searchQuery]);

  const handleAttendanceClick = async (studentId: number, status: "attended" | "absent") => {
    try {
      await markStudentAttendance(studentId, selectedDate, status);
      // 출석 정보 다시 가져오기
      await getAttendances();
    } catch (error) {
      console.error("출석 체크 실패:", error);
    }
  };

  return (
    <div className="w-[700px] h-[710px] flex flex-col p-2">
      <div className="flex items-center justify-between mb-6 gap-4 sticky top-0 bg-transparent z-10 pb-2">
        <h2 className="text-2xl font-semibold whitespace-nowrap">전체 학생 조회</h2>
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
        <div className="grid grid-cols-2 gap-2 pb-4">
          {filteredClassData.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
              {searchQuery ? "검색 결과가 없습니다" : "반이 없습니다"}
            </div>
          ) : (
            filteredClassData.map((classItem, index) => (
            <div 
              key={`${classItem.schoolType}-${classItem.grade}-${classItem.classNumber}`} 
              className="w-[330px] h-[450px] bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col flex-shrink-0"
            >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#5E99FF]">
                {getSchoolTypeName(classItem.schoolType)} {classItem.grade}학년 {classItem.classNumber}반
              </h3>
              <span className="text-sm text-[#5E99FF]">담임: {classItem.teacherName}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">번호</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">이름</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">출석 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {classItem.students.map((student, idx) => (
                    <tr key={student.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{idx + 1}</td>
                      <td className="py-3 px-4 text-sm">{student.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAttendanceClick(student.id, "attended")}
                            className={`px-3 py-1 text-xs rounded ${
                              student.status === "attended"
                                ? "bg-green-500 text-white"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            출석
                          </button>
                          <button
                            onClick={() => handleAttendanceClick(student.id, "absent")}
                            className={`px-3 py-1 text-xs rounded ${
                              student.status === "absent"
                                ? "bg-pink-500 text-white"
                                : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                            }`}
                          >
                            결석
                          </button>
                        </div>
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
    </div>
  );
}

