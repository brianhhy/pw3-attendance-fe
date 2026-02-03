"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SelectedPerson {
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

interface MatchingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedPerson: SelectedPerson | null;
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

export default function MatchingModal({
  open,
  onOpenChange,
  onConfirm,
  selectedPerson,
  selectedClass,
  activeTab,
}: MatchingModalProps) {
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
      <DialogContent className={`sm:max-w-[400px] border bg-transparent shadow-xl rounded-2xl p-0 overflow-hidden transition-all duration-300 ease-out border-blue-100 ${
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
