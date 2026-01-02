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

interface NewPeopleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "student" | "teacher"
}

export default function NewPeople({ open, onOpenChange, type }: NewPeopleProps) {
  const [formData, setFormData] = useState({
    name: "",
    birth: "",
    phone: "",
    parentPhone: "",
    school: "",
    number: "",
    memo: "",
  })
  const [schoolType, setSchoolType] = useState<"MIDDLE" | "HIGH" | "">("")
  const [grade, setGrade] = useState<"1" | "2" | "3" | "">("")
  const [classNumber, setClassNumber] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API 호출로 학생/선생님 추가
    console.log("제출 데이터:", { type, ...formData })
    // 모달 닫기
    onOpenChange(false)
    // 폼 초기화
    setFormData({
      name: "",
      birth: "",
      phone: "",
      parentPhone: "",
      school: "",
      number: "",
      memo: "",
    })
    setSchoolType("")
    setGrade("")
    setClassNumber("")
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // 반 범위 계산
  const getClassRange = (schoolType: "MIDDLE" | "HIGH" | "", grade: "1" | "2" | "3" | ""): number => {
    if (!schoolType || !grade) return 0
    
    if (schoolType === "MIDDLE") {
      if (grade === "1") return 6
      if (grade === "2") return 3
      if (grade === "3") return 4
    } else if (schoolType === "HIGH") {
      if (grade === "1") return 3
      if (grade === "2") return 2
      if (grade === "3") return 2
    }
    return 0
  }

  const handleSchoolTypeChange = (value: string) => {
    setSchoolType(value as "MIDDLE" | "HIGH" | "")
    setGrade("")
    setClassNumber("")
    if (type === "teacher") {
      handleChange("number", "")
    }
  }

  const handleGradeChange = (value: string) => {
    setGrade(value as "1" | "2" | "3" | "")
    setClassNumber("")
    if (type === "teacher") {
      handleChange("number", "")
    }
  }

  const handleClassNumberChange = (value: string) => {
    setClassNumber(value)
    if (type === "teacher" && schoolType && grade) {
      const schoolTypeName = schoolType === "MIDDLE" ? "중" : "고"
      handleChange("number", `${schoolTypeName} ${grade}-${value}`)
    }
  }

  const isStudent = type === "student"
  const classRange = getClassRange(schoolType, grade)

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        birth: "",
        phone: "",
        parentPhone: "",
        school: "",
        number: "",
        memo: "",
      })
      setSchoolType("")
      setGrade("")
      setClassNumber("")
    }
  }, [open])

  return (
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
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                required
              />
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
                    placeholder="중 1-1"
                    value={formData.school}
                    onChange={(e) => handleChange("school", e.target.value)}
                    className="border-0 bg-gray-100 focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:ring-0"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="schoolType">학교 타입</Label>
                  <select
                    id="schoolType"
                    value={schoolType}
                    onChange={(e) => handleSchoolTypeChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-base focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="">선택하세요</option>
                    <option value="MIDDLE">중학교</option>
                    <option value="HIGH">고등학교</option>
                  </select>
                </div>
                {schoolType && (
                  <div className="grid gap-2">
                    <Label htmlFor="grade">학년</Label>
                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="flex h-10 w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-base focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="">선택하세요</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                    </select>
                  </div>
                )}
                {schoolType && grade && classRange > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="classNumber">반</Label>
                    <select
                      id="classNumber"
                      value={classNumber}
                      onChange={(e) => handleClassNumberChange(e.target.value)}
                      className="flex h-10 w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-base focus-visible:border-2 focus-visible:border-[#5E99FF] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="">선택하세요</option>
                      {Array.from({ length: classRange }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num}반
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
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
  )
}
