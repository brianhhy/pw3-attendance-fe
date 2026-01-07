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
import { addNewStudent, updateStudent, deleteStudent } from "@/app/(shared)/(api)/student"
import { addNewTeacher, updateTeacher, deleteTeacher } from "@/app/(shared)/(api)/teacher"
import Alert from "@/app/(shared)/(modal)/Alert"
import Confirm from "@/app/(shared)/(modal)/Confirm"
import { formatPhoneNumber } from "@/app/(shared)/utils/modalUtil"

interface NewPeopleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "student" | "teacher"
  initialData?: any
}

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// teacherType을 소문자로 변환 (TEACHER -> teacher)
const formatTeacherType = (teacherType: string | null): string => {
  if (!teacherType) return "";
  const typeMap: { [key: string]: string } = {
    "TEACHER": "teacher",
    "HELPER": "helper",
    "PASTOR": "pastor"
  };
  return typeMap[teacherType.toUpperCase()] || teacherType.toLowerCase();
};

export default function NewPeople({ open, onOpenChange, type, initialData }: NewPeopleProps) {
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  
  const isEditMode = !!initialData

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isStudent) {
        if (isEditMode && initialData?.id) {
          await updateStudent(initialData.id, {
            name: formData.name,
            birth: formData.birth,
            sex: formData.sex,
            phone: formData.phone,
            parentPhone: formData.parentPhone,
            school: formData.school,
            memo: formData.memo,
          })
        } else {
          await addNewStudent({
            name: formData.name,
            birth: formData.birth,
            sex: formData.sex,
            phone: formData.phone,
            parentPhone: formData.parentPhone,
            school: formData.school,
            memo: formData.memo,
          })
        }
      } else {
        if (isEditMode && initialData?.id) {
          await updateTeacher(initialData.id, {
            name: formData.name,
            birth: formData.birth,
            sex: formData.sex,
            phone: formData.phone,
            teacherType: formData.teacherType,
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
      }
      // 성공 alert 표시
      setAlertType("success")
      setAlertMessage(`${isStudent ? "학생" : "선생님"}이 성공적으로 ${isEditMode ? "수정" : "추가"}되었습니다.`)
      setAlertOpen(true)
      // 성공 시 모달 닫기
      onOpenChange(false)
    } catch (error: any) {
      console.error(`${isEditMode ? "수정" : "추가"} 실패:`, error)
      // 실패 alert 표시 - 에러 메시지 우선순위
      let errorMessage = `${isEditMode ? "수정" : "추가"}에 실패했습니다.`
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

  const handlePhoneChange = (field: "phone" | "parentPhone", value: string) => {
    const formatted = formatPhoneNumber(value)
    setFormData((prev) => ({ ...prev, [field]: formatted }))
  }

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!isEditMode || !initialData?.id) return;
    
    try {
      if (isStudent) {
        await deleteStudent(initialData.id);
      } else {
        await deleteTeacher(initialData.id);
      }
      // 성공 alert 표시
      setAlertType("success");
      setAlertMessage(`${isStudent ? "학생" : "선생님"}이 성공적으로 삭제되었습니다.`);
      setAlertOpen(true);
      // 성공 시 모달 닫기
      onOpenChange(false);
    } catch (error: any) {
      console.error("삭제 실패:", error);
      // 실패 alert 표시
      let errorMessage = "삭제에 실패했습니다.";
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
  }

  const isStudent = type === "student"

  // initialData가 변경되거나 모달이 열릴 때 폼 데이터 설정
  useEffect(() => {
    if (open && initialData) {
      // 수정 모드: 기존 데이터로 폼 채우기
      setFormData({
        name: initialData.name || "",
        birth: formatDateForInput(initialData.birth),
        sex: initialData.sex || "",
        phone: initialData.phone || "",
        parentPhone: initialData.parentPhone || "",
        school: initialData.school || "",
        teacherType: type === "teacher" ? formatTeacherType(initialData.teacherType) : "",
        memo: initialData.memo || "",
      })
    } else if (open && !initialData) {
      // 새로 추가 모드: 폼 초기화
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
  }, [open, initialData, type])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] border-0 bg-[#F9F9FF] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 !duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <DialogHeader>
            <DialogTitle>{isEditMode ? (isStudent ? "학생 정보 수정" : "선생님 정보 수정") : (isStudent ? "새 학생" : "새 선생님")}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? (isStudent ? "학생 정보를 수정해주세요." : "선생님 정보를 수정해주세요.")
                : (isStudent ? "새로운 학생 정보를 입력해주세요." : "새로운 선생님 정보를 입력해주세요.")}
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
                  onChange={(e) => handlePhoneChange("phone", e.target.value)}
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
                      onChange={(e) => handlePhoneChange("parentPhone", e.target.value)}
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
            <DialogFooter className="flex justify-between">
              {isEditMode && (
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteClick}
                  className="text-gray-600 hover:text-red-500 hover:bg-transparent"
                >
                  삭제
                </Button>
              )}
              <Button 
                type="submit"
                className="bg-[#2C79FF] text-white hover:bg-[#2C79FF]/90"
              >
                {isEditMode ? "수정하기" : "추가"}
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
      <Confirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDeleteConfirm}
        type={type}
      />
    </>
  )
}
