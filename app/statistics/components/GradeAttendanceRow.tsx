"use client";

import { useEffect, useMemo, useState } from "react";
import { getGradeSundayStats } from "../../(shared)/(api)/attendance";
import GradeAttendanceChart from "./GradeAttendanceChart";

type GradeKey = "MIDDLE-1" | "MIDDLE-2" | "MIDDLE-3" | "HIGH-1" | "HIGH-2" | "HIGH-3";

type GradeStats = {
  total: number;
  rate: number;
};

type SundayStat = {
  sunday: [number, number, number];
  attendedCount: number;
  totalCount: number;
  attendanceRate: number;
};

type GradeData = {
  schoolType: "MIDDLE" | "HIGH";
  grade: 1 | 2 | 3;
  gradeName: string;
  sundayStats: SundayStat[];
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
  const [gradeDataList, setGradeDataList] = useState<GradeData[]>([]);

  // 학년별 일요일 출석 통계 데이터를 fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data: GradeData[] = await getGradeSundayStats();
        setGradeDataList(data);

        // 학년별 통계 계산
        const next = emptyStats();

        data.forEach((gradeData) => {
          const gradeKey = getGradeKey(gradeData.schoolType, gradeData.grade);
          if (!gradeKey) return;

          // 최근 일요일 데이터에서 전체 학생 수 가져오기
          const latestSunday = gradeData.sundayStats[gradeData.sundayStats.length - 1];
          const totalStudents = latestSunday ? latestSunday.totalCount : 0;

          // 평균 출석률 계산 (최근 5개 일요일 기준)
          const recent5 = gradeData.sundayStats.slice(-5);
          const averageRate = recent5.length > 0
            ? Math.round(recent5.reduce((sum, stat) => sum + stat.attendanceRate, 0) / recent5.length)
            : 0;

          next[gradeKey] = {
            total: totalStudents,
            rate: averageRate,
          };
        });

        setStatsByGrade(next);
      } catch (error) {
        console.error("학년별 통계 조회 실패:", error);
        setStatsByGrade(emptyStats());
        setGradeDataList([]);
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

  const filteredGradeData = useMemo(() => {
    if (!activeGrade) return null;
    const schoolTypeUpper = activeGrade.schoolLabel === "중학교" ? "MIDDLE" : "HIGH";
    return gradeDataList.find(
      (g) =>
        String(g.schoolType).toUpperCase() === schoolTypeUpper &&
        g.grade === activeGrade.grade
    );
  }, [activeGrade, gradeDataList]);

  return (
    <div className="w-full h-full max-h-[500px] rounded-2xl bg-[rgba(236,237,255,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-[#2C79FF] mb-4">학년별 통계</h1>
      
      <div className="flex-1 flex gap-6">
        {/* 왼쪽: 학년별 통계 2x3 그리드 */}
        <div className="flex-1 grid grid-cols-2 gap-4 content-start">
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
                  "rounded-xl backdrop-blur-md border border-white/60 p-4 transition-all duration-200 text-left",
                  "cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C79FF]/40",
                  isActive ? "bg-[rgba(112,164,255,0.55)] ring-2 ring-[#2C79FF]" : "bg-white/40 hover:bg-white/50",
                ].join(" ")}
              >
                <div className="text-lg font-bold text-gray-800 mb-3">
                  {item.schoolLabel} {item.grade}학년
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-600">전체 학생</span>
                    <span className="text-gray-800 font-bold">{isLoading ? "-" : `${s.total}명`}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-600">평균 출석률</span>
                    <span className="text-[#2C79FF] font-bold">{isLoading ? "-" : `${s.rate}%`}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 오른쪽: 차트 */}
        <div className="flex-[1.5]">
          <GradeAttendanceChart
            activeGrade={activeGrade} 
            gradeData={filteredGradeData}
          />
        </div>
      </div>
    </div>
  );
}