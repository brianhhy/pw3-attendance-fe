"use client"

import { Search, Calendar, Phone, Building2, Tag, Plus, Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import useTeacherStore from "../../(shared)/(store)/teacherStore"
import NewPeople from "../modal/NewPeople"
import { deleteTeacher } from "../../(shared)/(api)/teacher"
import Alert from "../../(shared)/(modal)/Alert"

// 날짜 포맷팅
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR");
};

export default function TeacherManagement() {
  const { teachers, getTeachers } = useTeacherStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setHasTimedOut(false);
    
    // 타임아웃 설정 (5초)
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, 5000);

    const fetchTeachers = async () => {
      try {
        await getTeachers();
      } catch (error) {
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchTeachers();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [getTeachers]);

  // 검색 필터링
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return teacher.name.toLowerCase().includes(query);
  });

  const filters = [
    { icon: <span className="text-xl font-normal">Aa</span>, label: "이름", key: "name" },
    { icon: <Building2 className="h-4 w-4" />, label: "담당 반", key: "number" },
    { icon: <Calendar className="h-4 w-4" />, label: "생년월일", key: "birth" },
    { icon: <Phone className="h-4 w-4" />, label: "전화번호", key: "phone" },
    { icon: <Tag className="h-4 w-4" />, label: "기타", key: "memo" },
  ]

  // 선생님 데이터에서 필터에 해당하는 값 가져오기
  const getTeacherValue = (teacher: any, key: string): string => {
    if (key === "birth") {
      return formatDate(teacher.birth);
    }
    if (key === "number") {
      return teacher.number || "-";
    }
    return teacher[key] || "-";
  }

  // 선생님 삭제 핸들러
  const handleDelete = async (teacherId: number) => {
    try {
      await deleteTeacher(teacherId);
      // 삭제 성공 후 리스트 새로고침
      await getTeachers();
      setAlertType("success");
      setAlertMessage("선생님이 성공적으로 삭제되었습니다.");
      setAlertOpen(true);
    } catch (error: any) {
      console.error("선생님 삭제 실패:", error);
      setAlertType("error");
      const errorMessage = error.response?.data?.message || error.message || "선생님 삭제 중 오류가 발생했습니다.";
      setAlertMessage(errorMessage);
      setAlertOpen(true);
    }
  }

  return (
    <div className="w-full max-w-[700px] bg-transparent p-3">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">선생님 관리</h1>
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

      <div className="max-h-[180px] overflow-y-auto">
        {isLoading && !hasTimedOut ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            리스트 로딩중
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {searchQuery ? "검색 결과가 없습니다" : "선생님이 없습니다"}
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="group relative grid grid-cols-5 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50">
              {filters.map((filter) => (
                <div key={filter.key} className="text-xs truncate">
                  {getTeacherValue(teacher, filter.key)}
                </div>
              ))}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                  onClick={() => {
                    // TODO: 수정 기능 구현
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                  onClick={() => handleDelete(teacher.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Teacher Button */}
      <div className="mt-2 flex justify-start">
        <Button 
          variant="ghost" 
          className="text-gray-600 hover:text-gray-900 whitespace-nowrap"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />새 선생님
        </Button>
      </div>

      {/* New People Modal */}
      <NewPeople 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        type="teacher" 
      />

      {/* Alert 모달 */}
      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </div>
  )
}
