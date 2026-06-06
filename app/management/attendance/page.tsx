"use client";

// import { useState } from "react";
// import Calendar from "../components/Calendar";
// import AttendanceManagement from "../components/AttendanceManagement";
import ClassAttendanceCard from "../components/ClassAttendanceCard";

export default function AttendancePage() {
  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] overflow-hidden flex flex-col">

      {/* lg 이상 */}
      <div className="hidden lg:flex flex-1 gap-6 p-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ClassAttendanceCard />
        </div>
        {/* <div className="w-[480px] flex-shrink-0 overflow-y-auto">
          <AttendanceManagement />
        </div> */}
      </div>

      {/* lg 미만: 반별 출석 카드만 */}
      <div className="lg:hidden flex-1 overflow-y-auto p-4">
        <ClassAttendanceCard />
      </div>

    </div>
  );
}
