"use client";

import { useEffect, useMemo, useState } from "react";
import { getClassRooms, getClassRoomSundaySummary, type ClassRoom, type ClassRoomSundaySummaryItem } from "../../(shared)/(api)/classroom";
import GradeAttendanceChart from "./GradeAttendanceChart";

type GradeKey = "MIDDLE-1" | "MIDDLE-2" | "MIDDLE-3" | "HIGH-1" | "HIGH-2" | "HIGH-3";

type GradeStats = {
  total: number;
  rate: number;
};

const GRADE_ITEMS: Array<{
  key: GradeKey;
  schoolLabel: "중학교" | "고등학교";
  grade: 1 | 2 | 3;
}> = [
  { key: "MIDDLE-1", schoolLabel: "중학교", grade: 1 },
  { key: "MIDDLE-2", schoolLabel: "중학교", grade: 2 },
  { key: "MIDDLE-3", schoolLabel: "중학교", grade: 3 },
  { key: "HIGH-1", schoolLabel: "고등학교", grade: 1 },
  { key: "HIGH-2", schoolLabel: "고등학교", grade: 2 },
  { key: "HIGH-3", schoolLabel: "고등학교", grade: 3 },
];

function emptyStats(): Record<GradeKey, GradeStats> {
  return {
    "MIDDLE-1": { total: 0, rate: 0 },
    "MIDDLE-2": { total: 0, rate: 0 },
    "MIDDLE-3": { total: 0, rate: 0 },
    "HIGH-1": { total: 0, rate: 0 },
    "HIGH-2": { total: 0, rate: 0 },
    "HIGH-3": { total: 0, rate: 0 },
  };
}

// 반의 평균 출석률 계산 (최근 5개 일요일 기준)
function calculateClassRoomAverageRate(sundayData: ClassRoomSundaySummaryItem[]): number {
  if (!Array.isArray(sundayData) || sundayData.length === 0) return 0;
  
  // 최근 5개만 사용
  const recent5 = sundayData.slice(-5);
  
  let totalAttended = 0;
  let totalCount = 0;
  
  recent5.forEach((item) => {
    totalAttended += Number(item.attendedCount) || 0;
    totalCount += Number(item.totalCount) || 0;
  });
  
  if (totalCount === 0) return 0;
  return Math.round((totalAttended / totalCount) * 100);
}

function getGradeKey(schoolType: string, grade: number): GradeKey | null {
  const st = String(schoolType).toUpperCase();
  if (st === "MIDDLE" && (grade === 1 || grade === 2 || grade === 3)) return `MIDDLE-${grade}` as GradeKey;
  if (st === "HIGH" && (grade === 1 || grade === 2 || grade === 3)) return `HIGH-${grade}` as GradeKey;
  return null;
}

export default function GradeAttendanceRow() {
  const [isLoading, setIsLoading] = useState(true);
  const [statsByGrade, setStatsByGrade] = useState<Record<GradeKey, GradeStats>>(emptyStats());
  const [activeGradeKey, setActiveGradeKey] = useState<GradeKey | null>(null);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [classRoomDataMap, setClassRoomDataMap] = useState<Map<number, ClassRoomSundaySummaryItem[]>>(new Map());

  // 반 목록과 각 반의 일요일 데이터를 fetch하여 학년별 통계 계산
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. 전체 반 목록 조회
        const allClassRooms = await getClassRooms();
        setClassRooms(allClassRooms);

        // 2. 각 반의 일요일 데이터 병렬 fetch
        const classRoomDataPromises = allClassRooms.map((classroom) =>
          getClassRoomSundaySummary(classroom.id)
            .then((data) => ({ classRoom: classroom, sundayData: data }))
            .catch(() => ({ classRoom: classroom, sundayData: [] }))
        );

        const classRoomDataList = await Promise.all(classRoomDataPromises);

        // Sunday 데이터를 Map으로 저장 (중복 API 호출 방지)
        const dataMap = new Map<number, ClassRoomSundaySummaryItem[]>();
        classRoomDataList.forEach((item) => {
          dataMap.set(item.classRoom.id, item.sundayData);
        });
        setClassRoomDataMap(dataMap);

        // 3. 학년별로 그룹화하고 통계 계산
        const next = emptyStats();

        GRADE_ITEMS.forEach((gradeItem) => {
          const schoolTypeUpper = gradeItem.schoolLabel === "중학교" ? "MIDDLE" : "HIGH";
          
          // 해당 학년에 속한 반들 필터링
          const gradeClassRooms = classRoomDataList.filter(
            (item) =>
              String(item.classRoom.schoolType).toUpperCase() === schoolTypeUpper &&
              item.classRoom.grade === gradeItem.grade
          );

          if (gradeClassRooms.length === 0) {
            next[gradeItem.key] = { total: 0, rate: 0 };
            return;
          }

          // 각 반의 평균 출석률 계산
          const classRates = gradeClassRooms.map((item) =>
            calculateClassRoomAverageRate(item.sundayData)
          );

          // 학년 평균 출석률 = 모든 반의 평균 출석률의 평균
          const gradeAverageRate = classRates.length > 0
            ? Math.round(classRates.reduce((sum, rate) => sum + rate, 0) / classRates.length)
            : 0;

          // 전체 학생 수 = 각 반의 최근 일요일 totalCount 합
          const totalStudents = gradeClassRooms.reduce((sum, item) => {
            if (!Array.isArray(item.sundayData) || item.sundayData.length === 0) return sum;
            const latestSunday = item.sundayData[item.sundayData.length - 1];
            return sum + (Number(latestSunday.totalCount) || 0);
          }, 0);

          next[gradeItem.key] = {
            total: totalStudents,
            rate: gradeAverageRate,
          };
        });

        setStatsByGrade(next);
      } catch (error) {
        console.error("학년별 통계 조회 실패:", error);
        setStatsByGrade(emptyStats());
        setClassRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeGrade = useMemo(() => {
    if (!activeGradeKey) return null;
    const found = GRADE_ITEMS.find((g) => g.key === activeGradeKey);
    if (!found) return null;
    return { schoolLabel: found.schoolLabel, grade: found.grade };
  }, [activeGradeKey]);

  const filteredClassRooms = useMemo(() => {
    if (!activeGrade) return [];
    const schoolTypeUpper = activeGrade.schoolLabel === "중학교" ? "MIDDLE" : "HIGH";
    return classRooms.filter(
      (c) =>
        String(c.schoolType).toUpperCase() === schoolTypeUpper &&
        c.grade === activeGrade.grade
    );
  }, [activeGrade, classRooms]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-[#2C79FF] mb-3">학년별 통계</h1>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[980px] flex gap-4">
        {GRADE_ITEMS.map((item) => {
          const s = statsByGrade[item.key];
          const isActive = activeGradeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveGradeKey((prev) => (prev === item.key ? null : item.key))}
              className={[
                "flex-1 min-w-[150px] rounded-2xl backdrop-blur-md border border-white/60 px-5 py-4 transition-all duration-200 text-left",
                "cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C79FF]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                isActive ? "bg-[rgba(112,164,255,0.55)]" : "bg-white/40 hover:bg-white/50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xl font-bold text-gray-800 whitespace-nowrap">
                  {item.schoolLabel} {item.grade}학년
                </div>
              </div>

              <div className="flex items-center justify-between text-lg font-medium">
                <span className="text-gray-700">전체 학생</span>
                <span className="text-gray-800">{isLoading ? "-" : `${s.total}명`}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-medium mt-1">
                <span className="text-gray-700">평균 출석률</span>
                <span className="text-[#6366F1]">{isLoading ? "-" : `${s.rate}%`}</span>
              </div>
            </button>
          );
        })}
        </div>
      </div>

      <GradeAttendanceChart 
        activeGrade={activeGrade} 
        classRooms={filteredClassRooms}
        classRoomDataMap={classRoomDataMap}
      />
    </div>
  );
}