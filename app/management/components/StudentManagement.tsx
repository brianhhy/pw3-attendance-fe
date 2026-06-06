"use client"

import { Calendar, Phone, Users, Building2, Tag, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import useAttendanceStore from "../../(shared)/(store)/attendanceStore"
import { getStudentsList } from "../../(shared)/(api)/student"
import { queryKeys } from "../../(shared)/(api)/queryKeys"
import NewPeople from "../modal/NewPeople"
import Search from "../../(shared)/(components)/Search"

const getSchoolTypeName = (schoolType: string): string => {
  switch (schoolType) {
    case "MIDDLE":
      return "중";
    case "HIGH":
      return "고";
    case "ELEMENTARY":
      return "초";
    default:
      return "학교";
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR");
};

interface StudentManagementProps {
  onSelect?: (student: any) => void;
  selectedId?: number | null;
}

export default function StudentManagement({ onSelect, selectedId }: StudentManagementProps = {}) {
  const queryClient = useQueryClient();
  const { headerSearch, setHeaderSearch } = useAttendanceStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (headerSearch?.type === "student") {
      setSearchQuery(headerSearch.query);
      setHeaderSearch(null);
    }
  }, [headerSearch]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: students = [], isPending } = useQuery({
    queryKey: queryKeys.students(),
    queryFn: getStudentsList,
  });

  const filteredStudents = students.filter((student: any) => {
    if (!searchQuery.trim()) return true;
    return student.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filters = [
    { icon: <span className="text-xl font-normal">Aa</span>, label: "이름", key: "name" },
    { icon: <Tag className="h-4 w-4" />, label: "소속 반", key: "class" },
    { icon: <Calendar className="h-4 w-4" />, label: "생년월일", key: "birth" },
    { icon: <Phone className="h-4 w-4" />, label: "전화번호", key: "phone" },
    { icon: <Users className="h-4 w-4" />, label: "부모님 연락처", key: "parentPhone" },
    { icon: <Building2 className="h-4 w-4" />, label: "소속 학교", key: "school" },
  ]

  const getStudentValue = (student: any, key: string): string => {
    if (key === "birth") {
      return formatDate(student.birth);
    }
    if (key === "school") {
      return student.school || "-";
    }
    if (key === "class") {
      const currentYear = new Date().getFullYear().toString();
      const classesCurrentYear = student.classesByYear?.[currentYear];
      const classInfo = classesCurrentYear?.[0];
      return classInfo?.name || "-";
    }
    return student[key] || "-";
  }

  return (
    <div className="w-full bg-transparent p-3">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">학생 관리</h1>
        <Search
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onToggle={() => setIsSearchOpen(!isSearchOpen)}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="grid grid-cols-6 gap-4 pb-4 border-b border-gray-200">
        {filters.map((filter, index) => (
          <button
            key={index}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
          >
            {filter.icon}
            <span className="text-xs">{filter.label}</span>
          </button>
        ))}
      </div>

      <div className="max-h-[90px] lg:max-h-[180px] overflow-y-auto">
        {isPending ? (
          <>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className={`grid grid-cols-6 gap-4 py-3 border-b border-gray-100 ${
                  index % 2 === 1 ? "bg-gray-50/50" : ""
                }`}
              >
                {[...Array(6)].map((_, colIndex) => (
                  <div key={colIndex} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {searchQuery ? "검색 결과가 없습니다" : "학생이 없습니다"}
          </div>
        ) : (
          filteredStudents.map((student: any, index: number) => (
            <div
              key={student.id}
              className={`group relative grid grid-cols-6 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedId === student.id ? "bg-blue-50 hover:bg-blue-50" : index % 2 === 1 ? "bg-gray-50/50" : ""
              }`}
              onClick={() => {
                if (onSelect) {
                  onSelect(student);
                } else {
                  setIsModalOpen(true);
                  setSelectedStudent(student);
                }
              }}
            >
              {filters.map((filter) => (
                <div key={filter.key} className="text-xs truncate">
                  {getStudentValue(student, filter.key)}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="mt-2 flex justify-start">
        <Button
          variant="ghost"
          className="text-gray-600 hover:text-gray-900 whitespace-nowrap"
          onClick={() => {
            setSelectedStudent(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />새 학생
        </Button>
      </div>

      <NewPeople
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedStudent(null);
            queryClient.invalidateQueries({ queryKey: queryKeys.students() });
          }
        }}
        type="student"
        initialData={selectedStudent}
      />
    </div>
  )
}
