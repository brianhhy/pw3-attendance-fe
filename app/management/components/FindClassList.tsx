"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStudentsList } from "@/app/(shared)/(api)/student";
import { getTeacherList } from "@/app/(shared)/(api)/teacher";

interface StudentItem {
  id: number;
  name: string;
  birth: string | null;
  sex: string | null;
  phone: string | null;
  parentPhone: string | null;
  school: string | null;
  memo: string | null;
  deletedAt: string | null;
  classesByYear: {
    [year: string]: any[];
  } | null;
}

interface TeacherItem {
  id: number;
  name: string;
  number: string;
  status: string;
}

interface FindClassListProps {
  activeTab: "student" | "teacher";
  onSelect: (item: { id: number; name: string; type: "student" | "teacher"; school?: string | null }) => void;
  selectedItemId?: number;
  excludedStudentIds?: number[];
  excludedTeacherIds?: number[];
}

export default function FindClassList({ activeTab, onSelect, selectedItemId, excludedStudentIds = [], excludedTeacherIds = [] }: FindClassListProps) {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "student") {
          const data = await getStudentsList();
          const filteredStudents = data.filter((student: StudentItem) => {
            return !student.classesByYear || Object.keys(student.classesByYear).length === 0;
          });
          setStudents(filteredStudents);
        } else {
          const data = await getTeacherList();
          setTeachers(data);
        }
      } catch (error) {
        console.error("데이터 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const filteredStudents = students.filter((student) => {
    // 배정 완료된 학생 제외 (프론트 선반영)
    if (excludedStudentIds.includes(student.id)) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return student.name.toLowerCase().includes(query) || 
           (student.school && student.school.toLowerCase().includes(query));
  });

  const filteredTeachers = teachers.filter((teacher) => {
    // 배정 완료된 선생님 제외 (프론트 선반영)
    if (excludedTeacherIds.includes(teacher.id)) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return teacher.name.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center max-h-[calc(100vh-100px)]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-300px)] max-w-[550px] flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-medium">
          {activeTab === "student" ? "반 배정이 필요한 학생" : "반 배정이 필요한 선생님"}
        </h2>
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
            placeholder={activeTab === "student" ? "학생 이름을 입력하세요." : "선생님 이름을 입력하세요."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 bg-gray-50 border-none transition-all duration-300 ${
              isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "student" ? (
          filteredStudents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchQuery ? "검색 결과가 없습니다" : "반 배정이 필요한 학생이 없습니다."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect({ id: student.id, name: student.name, type: "student", school: student.school });
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedItemId === student.id
                      ? "border-[#2C79FF] bg-[#F7F8FF]"
                      : "border-gray-200 hover:bg-[#F7F8FF] hover:border-[#2C79FF]"
                  }`}
                >
                  <div className="font-semibold">{student.name}</div>
                  {student.school && (
                    <div className="text-sm text-gray-600 mt-1">{student.school}</div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          filteredTeachers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchQuery ? "검색 결과가 없습니다" : "반 배정이 필요한 선생님이 없습니다."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect({ id: teacher.id, name: teacher.name, type: "teacher" });
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedItemId === teacher.id
                      ? "border-[#2C79FF] bg-[#F7F8FF]"
                      : "border-gray-200 hover:bg-[#F7F8FF] hover:border-[#2C79FF]"
                  }`}
                >
                  <div className="font-semibold">{teacher.name}</div>
                  {teacher.number && (
                    <div className="text-sm text-gray-600 mt-1">담당 반: {teacher.number}</div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

