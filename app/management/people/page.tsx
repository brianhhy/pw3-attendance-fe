"use client";

import { useState, useEffect } from "react";
import { User, UserStar } from "lucide-react";
import StudentManagement from "../components/StudentManagement";
import TeacherManagement from "../components/TeacherManagement";
import NewPeople from "../modal/NewPeople";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";

type TabType = "student" | "teacher";

export default function PeoplePage() {
  const { headerSearch } = useAttendanceStore();
  const [activeTab, setActiveTab] = useState<TabType>(
    headerSearch?.type ?? "student"
  );
  const [selectedPerson, setSelectedPerson] = useState<{ type: "student" | "teacher"; data: any } | null>(null);

  useEffect(() => {
    if (headerSearch?.type) {
      setActiveTab(headerSearch.type);
    }
  }, [headerSearch]);

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

        {/* lg 이상: 왼쪽 테이블 (학생+선생님), 오른쪽 상세 패널 */}
        <div className="hidden lg:flex gap-6 h-full">
          <div className="w-[45%] flex flex-col gap-6">
            <StudentManagement
              onSelect={(data) => setSelectedPerson({ type: "student", data })}
              selectedId={selectedPerson?.type === "student" ? selectedPerson.data?.id : null}
            />
            <TeacherManagement
              onSelect={(data) => setSelectedPerson({ type: "teacher", data })}
              selectedId={selectedPerson?.type === "teacher" ? selectedPerson.data?.id : null}
            />
          </div>
          <div className="flex-1">
            {selectedPerson ? (
              <NewPeople
                key={`${selectedPerson.type}-${selectedPerson.data?.id}`}
                open={true}
                onOpenChange={(open) => { if (!open) setSelectedPerson(null); }}
                type={selectedPerson.type}
                initialData={selectedPerson.data}
                asPanel
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                학생 또는 선생님을 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
