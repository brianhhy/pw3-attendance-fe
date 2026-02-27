"use client";

import { useState } from "react";
import { User, UserStar } from "lucide-react";
import StudentManagement from "../components/StudentManagement";
import TeacherManagement from "../components/TeacherManagement";

type TabType = "student" | "teacher";

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState<TabType>("student");

  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] flex flex-col">
      {/* 탭 버튼 - lg 미만에서만 표시 */}
      <div className="lg:hidden flex justify-center pt-6 pb-4 flex-shrink-0">
        <div className="relative inline-flex bg-white rounded-full p-1 shadow-md border-2 border-[#2C79FF]">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#2C79FF] rounded-full transition-all duration-300 ease-in-out ${
              activeTab === "student" ? "left-1" : "left-[calc(50%+2px)]"
            }`}
          />
          <button
            onClick={() => setActiveTab("student")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "student" ? "text-white" : "text-[#2C79FF]"
            }`}
          >
            <User className="w-5 h-5 hidden sm:block" />
            학생 관리
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`relative z-10 px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center gap-2 ${
              activeTab === "teacher" ? "text-white" : "text-[#2C79FF]"
            }`}
          >
            <UserStar className="w-5 h-5 hidden sm:block" />
            선생님 관리
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* lg 미만: 탭 전환 */}
        <div className="lg:hidden">
          {activeTab === "student" ? <StudentManagement /> : <TeacherManagement />}
        </div>

        {/* lg 이상: 가로 1:1 배치 */}
        <div className="hidden lg:flex gap-6">
          <div className="flex-1">
            <StudentManagement />
          </div>
          <div className="flex-1">
            <TeacherManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
