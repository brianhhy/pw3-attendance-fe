"use client"

import { Search, Calendar, Phone, Users, Building2, Tag, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import useStudentStore from "../../(shared)/(store)/studentStore"
import NewPeople from "../modal/NewPeople"

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

export default function StudentManagement() {
  const { students, getStudents } = useStudentStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasTimedOut(false);
    
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, 5000);

    const fetchStudents = async () => {
      try {
        await getStudents();
      } catch (error) {
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchStudents();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [getStudents]);

  const filteredStudents = students.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return student.name.toLowerCase().includes(query);
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
    <div className="w-full max-w-[700px] min-w-[400px] bg-transparent p-3">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">학생 관리</h1>
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

      <div className="max-h-[360px] lg:max-h-[180px] overflow-y-auto">
        {isLoading && !hasTimedOut ? (
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
          filteredStudents.map((student, index) => (
            <div 
              key={student.id} 
              className={`group relative grid grid-cols-6 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                index % 2 === 1 ? "bg-gray-50/50" : ""
              }`}
              onClick={() => {
                setIsModalOpen(true);
                setSelectedStudent(student);
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
        onOpenChange={async (open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedStudent(null);
            await getStudents();
          }
        }} 
        type="student"
        initialData={selectedStudent}
      />
    </div>
  )
}
