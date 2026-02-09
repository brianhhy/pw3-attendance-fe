"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TabButton from "@/app/management/components/TabButton";
import FindClassList from "@/app/management/components/FindClassList";
import RestClassList from "@/app/management/components/RestClassList";
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

// 확인 모달 컴포넌트
interface MatchingConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedPerson: SelectedItem | null;
  selectedClass: SelectedClass | null;
  activeTab: "student" | "teacher";
}

const getSchoolTypeName = (schoolType: string): string => {
  switch (schoolType) {
    case "MIDDLE":
      return "중학교";
    case "HIGH":
      return "고등학교";
    case "ELEMENTARY":
      return "초등학교";
    default:
      return "학교";
  }
};

function MatchingConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  selectedPerson,
  selectedClass,
  activeTab,
}: MatchingConfirmModalProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  if (!selectedPerson || !selectedClass) {
    return null;
  }

  const personType = activeTab === "student" ? "학생" : "선생님";
  const className = `${getSchoolTypeName(selectedClass.schoolType)} ${selectedClass.grade}학년 ${selectedClass.classNumber}반`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[400px] bg-white shadow-xl rounded-2xl p-0 overflow-hidden transition-all duration-300 ease-out border-none ${
        shouldAnimate 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      }`}>
        <div className="px-8 pt-10 pb-8">
          {/* Title */}
          <DialogTitle className="text-2xl font-bold text-[#2C79FF] text-center mb-4">
            반 배정 확인
          </DialogTitle>

          {/* Main Message */}
          <p className="text-lg text-[#5E99FF] text-center mb-8 leading-relaxed">
            <span className="font-bold text-[#2C79FF]">{className}</span>에 <br/><span className="font-bold text-[#2C79FF]">{selectedPerson.name}</span> {personType}을 배정하시겠습니까?
          </p>

          {/* Selected Items */}
          <div className="flex gap-8 mb-8 justify-center">
            {/* Selected Person */}
            <div className="flex-1 text-center">
              <div className="text-base font-semibold text-[#2C79FF] mb-3">
                선택한 {personType}
              </div>
              <div className="space-y-1">
                <div className="text-base font-medium">
                  {selectedPerson.name}
                </div>
                {selectedPerson.school && (
                  <div className="text-sm text-gray-500">
                    {selectedPerson.school}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Class */}
            <div className="flex-1 text-center">
              <div className="text-base font-semibold text-[#2C79FF] mb-3">
                선택한 반
              </div>
              <div className="text-base font-medium">
                {className}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="px-6 pb-8 flex flex-row !justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-13 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
          >
            취소하기
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="px-13 py-2.5 bg-[#5E99FF] text-white hover:bg-[#4D8AEF] transition-colors rounded-lg shadow-sm"
          >
            배정하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
      <MatchingConfirmModal
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
