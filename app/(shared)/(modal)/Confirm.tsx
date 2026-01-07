"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: "student" | "teacher"
}

export default function Confirm({ open, onOpenChange, onConfirm, type }: ConfirmProps) {
  const isStudent = type === "student"
  const targetName = isStudent ? "학생" : "선생님"
  
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] border border-red-100 bg-white shadow-xl rounded-2xl p-0 overflow-hidden">
        {/* Header with Icon */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                정말 삭제하시겠습니까?
              </DialogTitle>
              <DialogDescription className="text-base text-gray-700 leading-relaxed">
                현재까지 저장된 <span className="font-semibold text-red-600">{targetName || (type === "student" ? "학생" : "선생님")}의 출석 기록</span>이 영구적으로 삭제됩니다.
              </DialogDescription>
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
            className="px-6 py-2 bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition-all"
          >
            삭제하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}