"use client";

import { useState } from "react";
import { User, UserStar, CalendarCheck } from "lucide-react";
import StudentManagement from "./components/StudentManagement";
import TeacherManagement from "./components/TeacherManagement";
import AttendanceManagement from "./components/AttendanceManagement";

type TabType = "student" | "teacher" | "attendance";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("student");

  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] flex flex-col">
      {/* 탭 버튼 - lg 이하에서만 표시 */}
      <div className="lg:hidden flex justify-center pt-6 pb-4">
        <div className="relative inline-flex bg-white rounded-full p-1 shadow-md border-2 border-[#2C79FF]">
          {/* 슬라이딩 배경 */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] bg-[#2C79FF] rounded-full transition-all duration-300 ease-in-out ${
              activeTab === "student" 
                ? "left-1" 
                : activeTab === "teacher"
                ? "left-[calc(33.333%+2px)]"
                : "left-[calc(66.666%+2px)]"
            }`}
          />
          
          {/* 버튼들 */}
          <button
            onClick={() => setActiveTab("student")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "student"
                ? "text-white"
                : "text-[#2C79FF]"
            }`}
          >
            <User className="w-5 h-5 hidden sm:block" />
            학생 관리
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "teacher"
                ? "text-white"
                : "text-[#2C79FF]"
            }`}
          >
            <UserStar className="w-5 h-5 hidden sm:block" />
            선생님 관리
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "attendance"
                ? "text-white"
                : "text-[#2C79FF]"
            }`}
          >
            <CalendarCheck className="w-5 h-5 hidden sm:block" />
            출석 관리
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* lg 이하: 탭에 따라 하나만 표시 */}
        <div className="lg:hidden h-full">
          {activeTab === "student" && (
            <div className="flex flex-col overflow-hidden min-h-[400px] max-w-[700px] mx-auto h-full">
              <StudentManagement />
            </div>
          )}
          {activeTab === "teacher" && (
            <div className="flex flex-col overflow-hidden min-h-[400px] max-w-[700px] mx-auto h-full">
              <TeacherManagement />
            </div>
          )}
          {activeTab === "attendance" && (
            <div className="flex flex-col overflow-hidden min-h-[400px] max-w-[700px] mx-auto h-full">
              <AttendanceManagement />
            </div>
          )}
        </div>

        {/* lg 이상: 모두 표시 */}
        <div className="hidden lg:flex h-full gap-6">
          {/* 학생 관리 및 선생님 관리 */}
          <div className="max-w-[600px] flex flex-col gap-6">
            <StudentManagement />
            <TeacherManagement />
          </div>
          {/* 출석 관리 */}
          <div className="max-w-[700px] flex-1 flex flex-col">
            <AttendanceManagement />
          </div>
        </div>
      </div>
    </div>
  );
}

