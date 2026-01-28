"use client";

import { useState } from "react";
import { User, UserStar, CalendarCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentManagement from "./components/StudentManagement";
import TeacherManagement from "./components/TeacherManagement";
import AttendanceManagement from "./components/AttendanceManagement";
import TabButton from "./components/TabButton";
import FindClassList from "./components/FindClassList";
import RestClassList from "./components/RestClassList";
import MatchingModal from "./modal/MatchingModal";
import Alert from "@/app/(shared)/(modal)/Alert";
import { assignStudentToClass, assignTeacherToClass } from "@/app/(shared)/(api)/matching";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TabType = "student" | "teacher" | "attendance";
type MatchingTabType = "student" | "teacher";

interface SelectedItem {
  id: number;
  name: string;
  type: "student" | "teacher";
  school?: string | null;
}

interface SelectedClass {
  id: number;
  schoolType: string;
  grade: number;
  classNumber: number;
  name: string;
}

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("student");
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [matchingActiveTab, setMatchingActiveTab] = useState<MatchingTabType>("student");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedClass, setSelectedClass] = useState<SelectedClass | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [excludedStudentIds, setExcludedStudentIds] = useState<number[]>([]);
  const [excludedTeacherIds, setExcludedTeacherIds] = useState<number[]>([]);

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
            <User className="w-5 h-5" />
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
            <UserStar className="w-5 h-5" />
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
            <CalendarCheck className="w-5 h-5" />
            출석 관리
          </button>
        </div>
      </div>

      {/* 매칭 버튼 */}
      <div className="px-6 pb-4">
        <Button
          onClick={() => setIsMatchingModalOpen(true)}
          className="bg-[#2C79FF] hover:bg-[#2C79FF]/90 text-white flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          반 배정하기
        </Button>
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

      {/* 매칭 모달 */}
      <Dialog open={isMatchingModalOpen} onOpenChange={setIsMatchingModalOpen}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>반 배정</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            <div className="flex gap-4 justify-center pb-4">
              <TabButton
                label="학생 매칭"
                isActive={matchingActiveTab === "student"}
                onClick={() => {
                  setMatchingActiveTab("student");
                  setSelectedItem(null);
                  setExcludedStudentIds([]);
                  setExcludedTeacherIds([]);
                }}
              />
              <TabButton
                label="선생님 매칭"
                isActive={matchingActiveTab === "teacher"}
                onClick={() => {
                  setMatchingActiveTab("teacher");
                  setSelectedItem(null);
                  setExcludedStudentIds([]);
                  setExcludedTeacherIds([]);
                }}
              />
            </div>
            
            <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="flex-1 overflow-auto">
                <FindClassList 
                  key={`${matchingActiveTab}-${refreshKey}`}
                  activeTab={matchingActiveTab} 
                  onSelect={(item) => setSelectedItem(item)}
                  selectedItemId={selectedItem?.id}
                  excludedStudentIds={excludedStudentIds}
                  excludedTeacherIds={excludedTeacherIds}
                />
              </div>
              {selectedItem && (
                <div className="flex-1 overflow-auto" key={`${selectedItem.type}-${selectedItem.id}`}>
                  <RestClassList 
                    selectedItem={selectedItem}
                    activeTab={matchingActiveTab}
                    onClassSelect={(classItem) => {
                      setSelectedClass(classItem);
                      setIsConfirmModalOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 매칭 확인 모달 */}
      <MatchingModal
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        onConfirm={async () => {
          if (!selectedItem || !selectedClass) return;

          try {
            const currentYear = new Date().getFullYear();
            
            if (matchingActiveTab === "student") {
              await assignStudentToClass({
                studentId: selectedItem.id,
                classRoomId: selectedClass.id,
                schoolYear: currentYear,
              });
              
              setAlertType("success");
              setAlertMessage(`${selectedItem.name} 학생이 반에 성공적으로 배정되었습니다.`);
              setAlertOpen(true);
              
              setExcludedStudentIds((prev) => [...prev, selectedItem.id]);
            } else if (matchingActiveTab === "teacher") {
              await assignTeacherToClass({
                teacherId: selectedItem.id,
                classRoomId: selectedClass.id,
                schoolYear: currentYear,
              });
              
              setAlertType("success");
              setAlertMessage(`${selectedItem.name} 선생님이 반에 성공적으로 배정되었습니다.`);
              setAlertOpen(true);
              
              setExcludedTeacherIds((prev) => [...prev, selectedItem.id]);
            }
            
            setIsConfirmModalOpen(false);
            setSelectedItem(null);
            setSelectedClass(null);
            
            setRefreshKey((prev) => prev + 1);
          } catch (error: any) {
            console.error(`${matchingActiveTab === "student" ? "학생" : "선생님"} 배정 실패:`, error);
            
            let errorMessage = `${matchingActiveTab === "student" ? "학생" : "선생님"} 배정에 실패했습니다.`;
            if (error.response?.data) {
              const errorData = error.response.data;
              errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            setAlertType("error");
            setAlertMessage(errorMessage);
            setAlertOpen(true);
          }
        }}
        selectedPerson={selectedItem}
        selectedClass={selectedClass}
        activeTab={matchingActiveTab}
      />

      {/* Alert */}
      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </div>
  );
}

