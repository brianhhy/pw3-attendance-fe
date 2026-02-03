"use client";

import { useState } from "react";
import { User, UserStar } from "lucide-react";
import StudentAttendance from "./components/StudentAttendance";
import TeacherAttendance from "./components/TeacherAttendance";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"student" | "teacher">("student");

  return (
    <div className="flex flex-col h-full bg-linear-to-b from-[#FFFFFF] to-[#ECEDFF] p-6">
      {/* 탭 버튼 - lg 이하에서만 표시 */}
      <div className="lg:hidden flex justify-center">
        <div className="relative inline-flex bg-white rounded-full p-1 shadow-md border-2 border-[#2C79FF]">
          {/* 슬라이딩 배경 */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#2C79FF] rounded-full transition-all duration-300 ease-in-out ${
              activeTab === "student" ? "left-1" : "left-[calc(50%+2px)]"
            }`}
          />
          
          {/* 버튼들 */}
          <button
            onClick={() => setActiveTab("student")}
            className={`relative z-10 px-8 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "student"
                ? "text-white"
                : "text-[#2C79FF]"
            }`}
          >
            <User className="w-5 h-5 hidden sm:block" />
            학생
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`relative z-10 px-8 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "teacher"
                ? "text-white"
                : "text-[#2C79FF]"
            }`}
          >
            <UserStar className="w-5 h-5 hidden sm:block" />
            선생님
          </button>
        </div>
      </div>

      {/* 컴포넌트 영역 */}
      <div className="flex-1 flex items-start lg:items-center justify-center pt-6 lg:pt-0">
        {/* lg 이하: 선택된 탭만 표시 */}
        <div className="lg:hidden w-full flex justify-center">
          {activeTab === "student" ? <StudentAttendance /> : <TeacherAttendance />}
        </div>

        {/* lg 이상: 두 컴포넌트 모두 표시 */}
        <div className="hidden lg:flex gap-6">
          <StudentAttendance />
          <TeacherAttendance />
        </div>
      </div>
    </div>
  );
}
