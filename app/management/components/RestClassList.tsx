"use client";

import { useEffect, useState } from "react";
import { getStudentClassesByYear } from "@/app/(shared)/(api)/student";

interface ClassInfo {
  id: number;
  schoolType: string;
  grade: number;
  classNumber: number;
  name: string;
  className?: string;
  teacherName?: string;
}

interface RestClassListProps {
  selectedItem: { id: number; name: string; type: "student" | "teacher"; school?: string | null } | null;
  activeTab: "student" | "teacher";
  onClassSelect?: (classItem: ClassInfo) => void;
}

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

export default function RestClassList({ selectedItem, activeTab, onClassSelect }: RestClassListProps) {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      // 컴포넌트가 마운트된 후 약간의 지연을 두고 애니메이션 트리거
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [selectedItem]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedItem) {
        setClasses([]);
        return;
      }

      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const data = await getStudentClassesByYear(currentYear);
        
        if (Array.isArray(data)) {
          const uniqueClasses = data.reduce((acc: ClassInfo[], classItem: any) => {
            const classId = classItem.classRoomId || classItem.id;
            const existingClass = acc.find(c => c.id === classId);
            
            if (!existingClass) {
              acc.push({
                id: classId,
                schoolType: classItem.schoolType,
                grade: classItem.grade,
                classNumber: classItem.classNumber,
                name: classItem.className || `${classItem.grade}학년 ${classItem.classNumber}반`,
                className: classItem.className,
                teacherName: classItem.teacherName,
              });
            }
            return acc;
          }, []);
          
          // 선생님 매칭일 때는 담임이 없는 반만 필터링
          const filteredClasses = activeTab === "teacher" 
            ? uniqueClasses.filter((classItem) => !classItem.teacherName)
            : uniqueClasses;
          
          const sortedClasses = filteredClasses.sort((a, b) => {
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
            
            if (a.grade !== b.grade) {
              return a.grade - b.grade;
            }
            
            return a.classNumber - b.classNumber;
          });
          
          setClasses(sortedClasses);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error("반 목록 조회 실패:", error);
        setClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [selectedItem]);

  if (!selectedItem) {
    return null;
  }

  return (
    <div 
      className={`max-h-[calc(100vh-300px)] flex flex-col transition-all duration-300 ease-out ${
        shouldAnimate 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-5'
      }`}
    >
      <h2 className="text-xl font-bold mb-4">
        가능한 반 목록
      </h2>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            가능한 반이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onClassSelect) {
                    onClassSelect(classItem);
                  }
                }}
              >
                <div className="font-semibold text-lg">
                  {getSchoolTypeName(classItem.schoolType)} {classItem.grade}학년 {classItem.classNumber}반
                </div>
                {activeTab === "student" && (
                  <div className="text-sm text-gray-600 mt-1">
                    담임: {classItem.teacherName || "없음"}
                  </div>
                )}
                {activeTab === "teacher" && (
                  <div className="text-sm text-blue-600 mt-1">선택 가능</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

