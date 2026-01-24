"use client";

import { useState, useEffect } from "react";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import { getStudentAttendances } from "../../(shared)/(api)/attendance";
import OverallAttendanceChart from "./OverallAttendanceChart";

interface AttendanceStats {
  totalStudents: number;
  thisWeekAttendance: number;
  attendanceRate: number;
  thisWeekAttendanceRate: number;
}

export default function OverallAttendance() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    thisWeekAttendance: 0,
    attendanceRate: 0,
    thisWeekAttendanceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { students, getStudents } = useAttendanceStore();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // 전체 학생 수 가져오기
        await getStudents();
        
        // 이번 주 출석 데이터 계산
        const today = new Date();
        const schoolYear = today.getFullYear();
        const weekDates: string[] = [];
        
        // 이번 주 월요일부터 금요일까지 날짜 생성
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        
        for (let i = 0; i < 5; i++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          weekDates.push(dateStr);
        }

        // 각 날짜별 출석 데이터 가져오기
        let totalAttendedStudents = 0;
        const attendedStudentIds = new Set<number>();

        for (const date of weekDates) {
          try {
            const attendanceData = await getStudentAttendances(schoolYear, date);
            if (Array.isArray(attendanceData)) {
              attendanceData.forEach((classItem: any) => {
                if (classItem.students && Array.isArray(classItem.students)) {
                  classItem.students.forEach((student: any) => {
                    const status = student.status;
                    if (status && status !== null && status !== undefined && status !== "") {
                      const studentId = student.studentId || student.student_id;
                      if (studentId) {
                        attendedStudentIds.add(studentId);
                      }
                    }
                  });
                }
              });
            }
          } catch (error) {
            console.error(`날짜 ${date} 출석 데이터 조회 실패:`, error);
          }
        }

        const totalStudents = students.length || 0;
        const thisWeekAttendance = attendedStudentIds.size;
        const attendanceRate = totalStudents > 0 
          ? Math.round((thisWeekAttendance / (totalStudents * weekDates.length)) * 100)
          : 0;
        const thisWeekAttendanceRate = totalStudents > 0
          ? Math.round((thisWeekAttendance / totalStudents) * 100)
          : 0;

        setStats({
          totalStudents,
          thisWeekAttendance,
          attendanceRate,
          thisWeekAttendanceRate,
        });
      } catch (error) {
        console.error("출석 통계 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [getStudents, students.length]);

  if (isLoading) {
    return (
      <div className="w-full h-full rounded-2xl border border-white/55 bg-gradient-to-br from-white/35 via-white/15 to-white/10 shadow-[0_10px_40px_rgba(31,38,135,0.18)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/25 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl border border-white/55 bg-gradient-to-br from-white/35 via-white/15 to-white/10 shadow-[0_10px_40px_rgba(31,38,135,0.18)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/25 p-6">
      {/* 제목 */}
      <span className="block text-2xl font-semibold text-[#2C79FF] mb-2">전체 출석 현황</span>

      <div className="flex gap-6">
        {/* 왼쪽: 출석 수치 */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">전체 학생</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{stats.totalStudents}명</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">이번 주 출석</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{stats.thisWeekAttendance}명</span>
          </div>


          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">이번 주 출석률</span>
            <span className="text-2xl font-bold text-[#2C79FF]">{stats.thisWeekAttendanceRate}%</span>
          </div>
        </div>

        <OverallAttendanceChart />
      </div>
    </div>
  );
}
