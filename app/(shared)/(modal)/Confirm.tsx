"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: "student" | "teacher"
  mode?: "delete" | "assign"
  selectedPerson?: { id: number; name: string; type: "student" | "teacher" }
  selectedClass?: { id: number; name: string; schoolType: string; grade: number; classNumber: number; teacherName?: string }
}

export default function Confirm({ 
  open, 
  onOpenChange, 
  onConfirm, 
  type, 
  mode = "delete",
  selectedPerson,
  selectedClass
}: ConfirmProps) {
  const isStudent = type === "student"
  const targetName = isStudent ? "학생" : "선생님"
  const isAssignMode = mode === "assign"
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 약간의 지연을 두고 애니메이션 트리거
      const timer = setTimeout(() => {
        setShouldAnimate(true)
      }, 10)
      return () => clearTimeout(timer)
    } else {
      setShouldAnimate(false)
    }
  }, [open])
  
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[440px] border bg-white shadow-xl rounded-2xl p-0 overflow-hidden transition-all duration-300 ease-out ${
        isAssignMode ? "border-blue-100" : "border-red-100"
      } ${
        shouldAnimate 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      }`}>
        {/* Header with Icon */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
              isAssignMode ? "bg-blue-500" : "bg-red-500"
            }`}>
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 pt-1">
              {isAssignMode ? (
                <>
                  <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                    반 배정 확인
                  </DialogTitle>
                  <div className="text-base text-gray-700 leading-relaxed space-y-2">
                    <div>
                      <span className="font-semibold text-gray-900">{targetName}:</span>{" "}
                      <span className="text-gray-700">{selectedPerson?.name}</span>
                    </div>
                    {selectedClass && (
                      <div>
                        <span className="font-semibold text-gray-900">반:</span>{" "}
                        <span className="text-gray-700">
                          {getSchoolTypeName(selectedClass.schoolType)} {selectedClass.grade}학년 {selectedClass.classNumber}반
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                    정말 삭제하시겠습니까?
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-700 leading-relaxed">
                    현재까지 저장된 <span className="font-semibold text-red-600">{targetName || (type === "student" ? "학생" : "선생님")}의 출석 기록</span>이 영구적으로 삭제됩니다.
                  </DialogDescription>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="px-6 py-5 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={`px-6 py-2 text-white shadow-md hover:shadow-lg transition-all ${
              isAssignMode 
                ? "bg-blue-500 hover:bg-blue-600" 
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isAssignMode ? "배정하기" : "삭제하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}