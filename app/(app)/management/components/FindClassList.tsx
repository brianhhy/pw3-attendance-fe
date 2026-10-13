"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStudentsList } from "@/app/(shared)/(api)/student";
import { getTeacherList } from "@/app/(shared)/(api)/teacher";
import { queryKeys } from "@/app/(shared)/(api)/queryKeys";
import CustomScrollbar from "@/components/ui/CustomScrollbar";

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
  classesByYear: {
    [year: string]: any[];
  } | null;
}

interface FindClassListProps {
  activeTab: "student" | "teacher";
  onSelect: (item: { id: number; name: string; type: "student" | "teacher"; school?: string | null }) => void;
  selectedItemId?: number;
  excludedStudentIds?: number[];
  excludedTeacherIds?: number[];
}

export default function FindClassList({ activeTab, onSelect, selectedItemId, excludedStudentIds = [], excludedTeacherIds = [] }: FindClassListProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: students = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: queryKeys.studentsList(),
    queryFn: getStudentsList,
    enabled: activeTab === "student",
    select: (data: StudentItem[]) => data.filter((s) => !s.classesByYear || Object.keys(s.classesByYear).length === 0),
  });

  const { data: teachers = [] as TeacherItem[], isLoading: isTeachersLoading } = useQuery<TeacherItem[]>({
    queryKey: queryKeys.teachersList(),
    queryFn: getTeacherList,
    enabled: activeTab === "teacher",
    select: (data: TeacherItem[]) => data.filter((t) => !t.classesByYear || Object.keys(t.classesByYear).length === 0),
  });

  const isLoading = isStudentsLoading || isTeachersLoading;

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
      <div className="h-full max-w-[550px] flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 scrollbar-transparent-track">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-[550px] flex flex-col min-h-0">
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
            className={`pl-10 bg-gray-50 dark:bg-gray-800 border-none transition-all duration-300 ${
              isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        </div>
      </div>
      <CustomScrollbar className="flex-1 min-h-0" contentClassName="pr-3">
        {activeTab === "student" ? (
          filteredStudents.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
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
                      ? "border-[#2C79FF] bg-[#F7F8FF] dark:bg-[#2C79FF]/10"
                      : "border-gray-200 dark:border-gray-700 hover:bg-[#F7F8FF] dark:hover:bg-[#2C79FF]/10 hover:border-[#2C79FF]"
                  }`}
                >
                  <div className="font-semibold">{student.name}</div>
                  {student.school && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{student.school}</div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          filteredTeachers.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
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
                      ? "border-[#2C79FF] bg-[#F7F8FF] dark:bg-[#2C79FF]/10"
                      : "border-gray-200 dark:border-gray-700 hover:bg-[#F7F8FF] dark:hover:bg-[#2C79FF]/10 hover:border-[#2C79FF]"
                  }`}
                >
                  <div className="font-semibold">{teacher.name}</div>
                  {teacher.number && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">담당 반: {teacher.number}</div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </CustomScrollbar>
    </div>
  );
}

