"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudentClassesByYear } from "@/app/(shared)/(api)/student";
import { queryKeys } from "@/app/(shared)/(api)/queryKeys";

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

const CURRENT_YEAR = new Date().getFullYear();

function getSchoolTypePriority(schoolType: string): number {
  if (schoolType === "MIDDLE") return 1;
  if (schoolType === "ELEMENTARY") return 2;
  if (schoolType === "HIGH") return 3;
  return 4;
}

export default function RestClassList({ selectedItem, activeTab, onClassSelect }: RestClassListProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      const timer = setTimeout(() => setShouldAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [selectedItem]);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: queryKeys.classesByYear(CURRENT_YEAR),
    queryFn: async () => {
      const data = await getStudentClassesByYear(CURRENT_YEAR);
      if (!Array.isArray(data)) return [];
      const uniqueClasses = data.reduce((acc: ClassInfo[], classItem: any) => {
        const classId = classItem.classRoomId || classItem.id;
        if (!acc.find((c) => c.id === classId)) {
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
      return uniqueClasses.sort((a, b) => {
        const pa = getSchoolTypePriority(a.schoolType);
        const pb = getSchoolTypePriority(b.schoolType);
        if (pa !== pb) return pa - pb;
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.classNumber - b.classNumber;
      });
    },
    enabled: !!selectedItem,
    select: (data) => activeTab === "teacher" ? data.filter((c) => !c.teacherName) : data,
  });

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

