"use client";

import { useState } from "react";
import { UserStar, Users } from "lucide-react";
import ClassAttendanceCard from "../components/ClassAttendanceCard";
import TeacherAttendanceSection from "../components/TeacherAttendanceCard";

type TabType = "teacher" | "student";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("teacher");

  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] flex flex-col overflow-hidden">

      {/* 탭 */}
      <div className="flex-shrink-0 flex justify-center lg:justify-start pt-6 pb-4 px-6">
        <div className="relative inline-flex bg-white rounded-full p-1 shadow-md border-2 border-[#2C79FF]">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#2C79FF] rounded-full transition-all duration-300 ease-in-out ${
              activeTab === "teacher" ? "left-1" : "left-[calc(50%+2px)]"
            }`}
          />
          <button
            onClick={() => setActiveTab("teacher")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "teacher" ? "text-white" : "text-[#2C79FF]"
            }`}
          >
            <UserStar className="w-4 h-4" />
            선생님 출석
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "student" ? "text-white" : "text-[#2C79FF]"
            }`}
          >
            <Users className="w-4 h-4" />
            학생 출석
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 min-h-0 px-6 pb-6 overflow-y-auto">
        {activeTab === "teacher" ? (
          <TeacherAttendanceSection />
        ) : (
          <ClassAttendanceCard />
        )}
      </div>

    </div>
  );
}
