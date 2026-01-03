"use client"

import { useEffect } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

interface AlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "success" | "error"
  title?: string
  message: string
  duration?: number // 자동 닫힘 시간 (ms), 0이면 자동 닫히지 않음
}

export default function Alert({ open, onOpenChange, type, title, message, duration = 2000 }: AlertProps) {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [open, duration, onOpenChange])

  const isSuccess = type === "success"
  const alertTitle = title || (isSuccess ? "성공" : "오류")

  if (!open) return null

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-slide-down">
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            isSuccess ? "bg-white border-green-200" : "bg-white border-red-200"
          }`}
        >
          {/* 아이콘 */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isSuccess ? "bg-[#9EFC9B]" : "bg-red-100"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-[#00CB18]" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>

          {/* 텍스트 */}
          <div className="flex flex-col gap-0.5">
            <div className="font-semibold text-sm text-gray-900">{alertTitle}</div>
            <div className="text-sm text-gray-600">{message}</div>
          </div>
        </div>
      </div>
    </>
  )
}
