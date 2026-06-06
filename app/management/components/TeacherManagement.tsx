"use client"

import { Calendar, Phone, Building2, Tag, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getTeacherList } from "../../(shared)/(api)/teacher"
import { queryKeys } from "../../(shared)/(api)/queryKeys"
import NewPeople from "../modal/NewPeople"
import Search from "../../(shared)/(components)/Search"
import useAttendanceStore from "../../(shared)/(store)/attendanceStore"

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR");
};

interface TeacherManagementProps {
  onSelect?: (teacher: any) => void;
  selectedId?: number | null;
}

export default function TeacherManagement({ onSelect, selectedId }: TeacherManagementProps = {}) {
  const queryClient = useQueryClient();
  const { headerSearch, setHeaderSearch } = useAttendanceStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (headerSearch?.type === "teacher") {
      setSearchQuery(headerSearch.query);
      setHeaderSearch(null);
    }
  }, [headerSearch]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const { data: teachers = [], isPending } = useQuery({
    queryKey: queryKeys.teachers(),
    queryFn: getTeacherList,
  });

  const filteredTeachers = teachers.filter((teacher: any) => {
    if (!searchQuery.trim()) return true;
    return teacher.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filters = [
    { icon: <span className="text-xl font-normal">Aa</span>, label: "이름", key: "name" },
    { icon: <Building2 className="h-4 w-4" />, label: "담당 반", key: "number" },
    { icon: <Calendar className="h-4 w-4" />, label: "생년월일", key: "birth" },
    { icon: <Phone className="h-4 w-4" />, label: "전화번호", key: "phone" },
    { icon: <Tag className="h-4 w-4" />, label: "기타", key: "memo" },
  ]

  const getTeacherValue = (teacher: any, key: string): string => {
    if (key === "birth") {
      return formatDate(teacher.birth);
    }
    if (key === "number") {
      const currentYear = new Date().getFullYear().toString();
      const classesCurrentYear = teacher.classesByYear?.[currentYear];
      const classInfo = classesCurrentYear?.[0];
      return classInfo?.name || "-";
    }
    return teacher[key] || "-";
  }

  return (
    <div className="w-full bg-transparent p-3">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">선생님 관리</h1>
        <Search
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onToggle={() => setIsSearchOpen(!isSearchOpen)}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="grid grid-cols-5 gap-4 pb-4 border-b border-gray-200">
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
                className={`grid grid-cols-5 gap-4 py-3 border-b border-gray-100 ${
                  index % 2 === 1 ? "bg-gray-50/50" : ""
                }`}
              >
                {[...Array(5)].map((_, colIndex) => (
                  <div key={colIndex} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {searchQuery ? "검색 결과가 없습니다" : "선생님이 없습니다"}
          </div>
        ) : (
          filteredTeachers.map((teacher: any, index: number) => (
            <div
              key={teacher.id}
              className={`group relative grid grid-cols-5 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedId === teacher.id ? "bg-blue-50 hover:bg-blue-50" : index % 2 === 1 ? "bg-gray-50/50" : ""
              }`}
              onClick={() => {
                if (onSelect) {
                  onSelect(teacher);
                } else {
                  setIsModalOpen(true);
                  setSelectedTeacher(teacher);
                }
              }}
            >
              {filters.map((filter) => (
                <div key={filter.key} className="text-xs truncate">
                  {getTeacherValue(teacher, filter.key)}
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
            setSelectedTeacher(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />새 선생님
        </Button>
      </div>

      <NewPeople
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedTeacher(null);
            queryClient.invalidateQueries({ queryKey: queryKeys.teachers() });
          }
        }}
        type="teacher"
        initialData={selectedTeacher}
      />
    </div>
  )
}
