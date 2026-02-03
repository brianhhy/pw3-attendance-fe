"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TabButton from "@/app/management/components/TabButton";
import FindClassList from "@/app/management/components/FindClassList";
import RestClassList from "@/app/management/components/RestClassList";
import MatchingModal from "@/app/management/modal/MatchingModal";
import Alert from "./Alert";
import { assignStudentToClass, assignTeacherToClass } from "../(api)/matching";

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

interface MatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MatchingDialog({ open, onOpenChange }: MatchingDialogProps) {
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

  const handleConfirm = async () => {
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
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[80vh] h-[80vh] bg-white border-none flex flex-col">
          <DialogHeader className="sticky top-0 bg-transparent z-10 pb-4 flex-shrink-0">
            <DialogTitle>반 배정하기</DialogTitle>
            <div className="flex gap-4 justify-center pt-4">
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
          </DialogHeader>
          
          <div className="flex-1 flex flex-col gap-6 overflow-hidden pt-4">
            <div className="flex-shrink-0 overflow-auto max-h-[50%]">
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
        </DialogContent>
      </Dialog>

      {/* 매칭 확인 모달 */}
      <MatchingModal
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        onConfirm={handleConfirm}
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
    </>
  );
}
