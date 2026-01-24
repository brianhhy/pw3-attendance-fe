"use client";

import OverallAttendance from "./components/OverallAttendance";
import MonthlyRegisteredStudents from "./components/MonthlyRegisteredStudents";
import GradeAttendanceRow from "./components/GradeAttendanceRow";

export default function StatisticsPage() {
  return (
    <div className="w-full min-h-screen p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex gap-6 items-stretch">
          <div className="flex-[2.5] min-w-0">
            <OverallAttendance />
          </div>
          <div className="flex-[1.5] min-w-0">
            <MonthlyRegisteredStudents />
          </div>
        </div>
        <GradeAttendanceRow />
      </div>
    </div>
  );
}

