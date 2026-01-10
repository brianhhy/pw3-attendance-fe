"use client";

import { useState } from "react";
import TabButton from "./components/TabButton";
import FindClassList from "./components/FindClassList";
import RestClassList from "./components/RestClassList";
import MatchingModal from "./modal/MatchingModal";
import Alert from "@/app/(shared)/(modal)/Alert";
import { assignStudentToClass, assignTeacherToClass } from "@/app/(shared)/(api)/matching";

type TabType = "student" | "teacher";

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

export default function MatchingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("student");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedClass, setSelectedClass] = useState<SelectedClass | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [excludedStudentIds, setExcludedStudentIds] = useState<number[]>([]);
  const [excludedTeacherIds, setExcludedTeacherIds] = useState<number[]>([]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      <div className="flex gap-4 justify-center pt-6 pb-4">
        <TabButton
          label="학생 매칭"
          isActive={activeTab === "student"}
          onClick={() => {
            setActiveTab("student");
            setSelectedItem(null);
            // 탭 변경 시 제외 목록 초기화 (다시 fetch하므로)
            setExcludedStudentIds([]);
            setExcludedTeacherIds([]);
          }}
        />
        <TabButton
          label="선생님 매칭"
          isActive={activeTab === "teacher"}
          onClick={() => {
            setActiveTab("teacher");
            setSelectedItem(null);
            // 탭 변경 시 제외 목록 초기화
            setExcludedStudentIds([]);
            setExcludedTeacherIds([]);
          }}
        />
      </div>
      
      <div className="flex-1 flex gap-6 p-6">
        <div className="flex-1">
          <FindClassList 
            key={`${activeTab}-${refreshKey}`}
            activeTab={activeTab} 
            onSelect={(item) => setSelectedItem(item)}
            selectedItemId={selectedItem?.id}
            excludedStudentIds={excludedStudentIds}
            excludedTeacherIds={excludedTeacherIds}
          />
        </div>
        {selectedItem && (
          <div className="flex-1" key={`${selectedItem.type}-${selectedItem.id}`}>
            <RestClassList 
              selectedItem={selectedItem}
              activeTab={activeTab}
              onClassSelect={(classItem) => {
                setSelectedClass(classItem);
                setIsModalOpen(true);
              }}
            />
          </div>
        )}
      </div>

      <MatchingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={async () => {
          if (!selectedItem || !selectedClass) return;

          try {
            const currentYear = new Date().getFullYear();
            
            if (activeTab === "student") {
              await assignStudentToClass({
                studentId: selectedItem.id,
                classRoomId: selectedClass.id,
                schoolYear: currentYear,
              });
              
              // 성공 Alert 표시
              setAlertType("success");
              setAlertMessage(`${selectedItem.name} 학생이 반에 성공적으로 배정되었습니다.`);
              setAlertOpen(true);
              
              // 프론트 선반영: 배정된 학생 ID를 제외 목록에 추가
              setExcludedStudentIds((prev) => [...prev, selectedItem.id]);
            } else if (activeTab === "teacher") {
              await assignTeacherToClass({
                teacherId: selectedItem.id,
                classRoomId: selectedClass.id,
                schoolYear: currentYear,
              });
              
              // 성공 Alert 표시
              setAlertType("success");
              setAlertMessage(`${selectedItem.name} 선생님이 반에 성공적으로 배정되었습니다.`);
              setAlertOpen(true);
              
              // 프론트 선반영: 배정된 선생님 ID를 제외 목록에 추가
              setExcludedTeacherIds((prev) => [...prev, selectedItem.id]);
            }
            
            // 모달 닫기 및 상태 초기화
            setIsModalOpen(false);
            setSelectedItem(null);
            setSelectedClass(null);
            
            // FindClassList 리렌더링을 위한 refreshKey 증가 (서버에서 최신 데이터 가져오기)
            setRefreshKey((prev) => prev + 1);
          } catch (error: any) {
            console.error(`${activeTab === "student" ? "학생" : "선생님"} 배정 실패:`, error);
            
            // 에러 Alert 표시
            let errorMessage = `${activeTab === "student" ? "학생" : "선생님"} 배정에 실패했습니다.`;
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
        activeTab={activeTab}
      />

      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </div>
  );
}

