"use client";

import { useEffect, useState } from "react";
import OverallAttendance from "./components/OverallAttendance";
import MonthlyRegisteredStudents from "./components/MonthlyRegisteredStudents";
import ParentObservationAttendance from "./components/ParentObservationAttendance";
import GradeAttendanceRow from "./components/GradeAttendanceRow";
import useStatisticStore from "../(shared)/(store)/statisticStore";

export default function StatisticsPage() {
  const { fetchAll } = useStatisticStore();
  const [showParentObservation, setShowParentObservation] = useState(false);

  useEffect(() => {
    fetchAll();
    try {
      const raw = localStorage.getItem("pw3_event");
      if (!raw) return;
      const events = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [JSON.parse(raw)];
      const today = new Date().toISOString().slice(0, 10);
      setShowParentObservation(
        events.some((e: { date: string; type: string }) => e.date === today && e.type === "parents_observation")
      );
    } catch {
      // ignore
    }
  }, [fetchAll]);

  return (
    <div className="w-full min-h-screen p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      <div className="max-w-7xl mx-auto">
        {/* 전체 컨테이너 */}
        <div className="rounded-3xl bg-[rgba(245,247,255,0.6)] backdrop-blur-[16px] border border-[rgba(200,210,255,0.4)] p-6">
          <div className="space-y-6">
            <div className="flex gap-6 items-stretch">
              <div className="flex-[2.5] min-w-0">
                <OverallAttendance />
              </div>
              <div className="flex-[1.5] min-w-0">
                {showParentObservation ? <ParentObservationAttendance /> : <MonthlyRegisteredStudents />}
              </div>
            </div>
            <GradeAttendanceRow />
          </div>
        </div>
      </div>
    </div>
  );
}

