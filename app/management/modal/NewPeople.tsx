"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addNewStudent, addNewTeacher } from "@/app/(shared)/(api)/management"
import Alert from "@/app/(shared)/(modal)/Alert"

interface NewPeopleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "student" | "teacher"
}

export default function NewPeople({ open, onOpenChange, type }: NewPeopleProps) {
  const [formData, setFormData] = useState({
    name: "",
    birth: "",
    sex: "",
    phone: "",
    parentPhone: "",
    school: "",
    teacherType: "",
    memo: "",
  })
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState<"success" | "error">("success")
  const [alertMessage, setAlertMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isStudent) {
        await addNewStudent({
          name: formData.name,
          birth: formData.birth,
          sex: formData.sex,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          school: formData.school,
          memo: formData.memo,
        })
      } else {
        await addNewTeacher({
          name: formData.name,
          birth: formData.birth,
          sex: formData.sex,
          phone: formData.phone,
          teacherType: formData.teacherType,
          memo: formData.memo,
        })
      }
      // 성공 alert 표시
      setAlertType("success")
      setAlertMessage(`${isStudent ? "학생" : "선생님"}이 성공적으로 추가되었습니다.`)
      setAlertOpen(true)
      // 성공 시 모달 닫기
      onOpenChange(false)
      // 폼 초기화
      setFormData({
        name: "",
        birth: "",
        sex: "",
        phone: "",
        parentPhone: "",
        school: "",
        teacherType: "",
        memo: "",
      })
    } catch (error: any) {
      console.error("추가 실패:", error)
      // 실패 alert 표시 - 에러 메시지 우선순위
      let errorMessage = "추가에 실패했습니다."
      if (error.response?.data) {
        const errorData = error.response.data
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }
      setAlertType("error")
      setAlertMessage(errorMessage)
      setAlertOpen(true)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isStudent = type === "student"

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        birth: "",
        sex: "",
        phone: "",
        parentPhone: "",
        school: "",
        teacherType: "",
        memo: "",
      })
    }
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] border-0 bg-[#F9F9FF] !duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <DialogHeader>
            <DialogTitle>{isStudent ? "새 학생" : "새 선생님"}</DialogTitle>
            <DialogDescription>
              {isStudent
                ? "새로운 학생 정보를 입력해주세요."
                : "새로운 선생님 정보를 입력해주세요."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>이름 * / 성별</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    placeholder="이름을 입력하세요"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0 flex-1"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange("sex", "MAN")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.sex === "MAN"
                          ? "bg-[#2C79FF] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      남성
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("sex", "WOMAN")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.sex === "WOMAN"
                          ? "bg-[#2C79FF] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      여성
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="birth">생년월일</Label>
                <Input
                  id="birth"
                  type="date"
                  value={formData.birth}
                  onChange={(e) => handleChange("birth", e.target.value)}
                  className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                />
              </div>

              {isStudent ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="parentPhone">부모님 연락처</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      placeholder="010-1234-5678"
                      value={formData.parentPhone}
                      onChange={(e) => handleChange("parentPhone", e.target.value)}
                      className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="school">소속 학교</Label>
                    <Input
                      id="school"
                      placeholder="소속 학교를 입력하세요"
                      value={formData.school}
                      onChange={(e) => handleChange("school", e.target.value)}
                      className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="teacherType">선생님 타입</Label>
                  <select
                    id="teacherType"
                    value={formData.teacherType}
                    onChange={(e) => handleChange("teacherType", e.target.value)}
                    className="flex h-10 w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-base focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="">선택하세요</option>
                    <option value="teacher">선생님</option>
                    <option value="helper">도우미</option>
                    <option value="pastor">교역자</option>
                  </select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="memo">기타</Label>
                <Textarea
                  id="memo"
                  placeholder="기타 사항을 입력하세요"
                  value={formData.memo}
                  onChange={(e) => handleChange("memo", e.target.value)}
                  rows={3}
                  className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit"
                className="text-[#2C79FF] hover:bg-[#2C79FF] hover:text-white"
              >
                추가
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </>
  )
}
