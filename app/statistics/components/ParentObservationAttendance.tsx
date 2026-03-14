"use client";

import { useEffect, useState } from "react";
import { getParentAttendanceStats, type ParentAttendanceStats } from "../../(shared)/(api)/attendance";

export default function ParentObservationAttendance() {
    const today = new Date().toISOString().slice(0, 10);
    const [stats, setStats] = useState<ParentAttendanceStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getParentAttendanceStats(today);
                setStats(data);
            } catch {
                setError("부모님 출석 데이터를 불러오지 못했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, [today]);

    const rate = stats && stats.totalStudents > 0
        ? Math.round((stats.studentsWithParent / stats.totalStudents) * 100)
        : 0;

    return (
        <section className="w-full h-full rounded-2xl bg-[rgba(236,237,255,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-[#2C79FF] whitespace-nowrap">참관수업 출석률</h2>
                <span className="text-sm text-gray-500">{today}</span>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">로딩 중...</div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">{error}</div>
            ) : stats ? (
                <div className="flex-1 flex flex-col gap-3">
                    <div className="rounded-xl bg-white/30 backdrop-blur-md border border-white/45 px-4 py-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">전체 학생</span>
                        <span className="text-xl font-bold text-[#2C79FF]">{stats.totalStudents}명</span>
                    </div>
                    <div className="rounded-xl bg-white/30 backdrop-blur-md border border-white/45 px-4 py-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">부모님 참석 학생</span>
                        <span className="text-xl font-bold text-[#2C79FF]">{stats.studentsWithParent}명</span>
                    </div>
                    <div className="rounded-xl bg-white/30 backdrop-blur-md border border-white/45 px-4 py-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">총 참석 부모님 수</span>
                        <span className="text-xl font-bold text-[#2C79FF]">{stats.totalParentsAttended}명</span>
                    </div>
                    <div className="rounded-xl bg-gradient-to-r from-[#2C79FF]/20 to-[#2C79FF]/10 backdrop-blur-md border border-[#2C79FF]/30 px-4 py-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">참석률</span>
                        <span className="text-2xl font-bold text-[#2C79FF]">{rate}%</span>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
