"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, ImagePlus, Loader2, Trash2, X } from "lucide-react"
import { addNewStudent, updateStudent, deleteStudent } from "@/app/(shared)/(api)/student"
import { addNewTeacher, updateTeacher, deleteTeacher } from "@/app/(shared)/(api)/teacher"
import {
  deleteFaceImage,
  getFaceImage,
  uploadFaceImage,
} from "@/app/(shared)/(api)/faceImage"
import { queryKeys } from "@/app/(shared)/(api)/queryKeys"
import Alert from "@/app/(shared)/(modal)/Alert"
import Confirm from "@/app/(shared)/(modal)/Confirm"
import { formatPhoneNumber } from "@/app/(shared)/utils/modalUtil"

interface NewPeopleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "student" | "teacher"
  initialData?: PersonData
  asPanel?: boolean
}

interface PersonData {
  id: number
  name?: string | null
  birth?: string | null
  sex?: string | null
  phone?: string | null
  parentPhone?: string | null
  school?: string | null
  teacherType?: string | null
  memo?: string | null
  hasFaceImage?: boolean
}

const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTeacherType = (teacherType?: string | null): string => {
  if (!teacherType) return "";
  const typeMap: { [key: string]: string } = {
    "TEACHER": "teacher",
    "HELPER": "helper",
    "PASTOR": "pastor"
  };
  return typeMap[teacherType.toUpperCase()] || teacherType.toLowerCase();
};

function getPeopleErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === "object" && data !== null) {
      const errorData = data as { message?: string; error?: string };
      return errorData.message || errorData.error || JSON.stringify(data) || fallback;
    }
    return String(data) || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

class FaceImageSaveError extends Error {}

const ALLOWED_FACE_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FACE_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FACE_IMAGE_DIMENSION = 4096;

export default function NewPeople({ open, onOpenChange, type, initialData, asPanel }: NewPeopleProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null)
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null)
  const [currentHasFaceImage, setCurrentHasFaceImage] = useState(false)
  const [removeFaceImage, setRemoveFaceImage] = useState(false)

  const isStudent = type === "student"
  const isEditMode = !!initialData
  const personId = initialData?.id ? Number(initialData.id) : null

  const faceImageQuery = useQuery({
    queryKey: queryKeys.faceImage(type, personId ?? 0),
    queryFn: () => getFaceImage(type, personId!),
    enabled:
      open &&
      personId !== null &&
      currentHasFaceImage &&
      !removeFaceImage,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      let savedPerson: { id?: number | string } | undefined;

      if (isStudent) {
        const payload = { name: formData.name, birth: formData.birth, sex: formData.sex, phone: formData.phone, parentPhone: formData.parentPhone, school: formData.school, memo: formData.memo };
        if (isEditMode && initialData?.id) savedPerson = await updateStudent(initialData.id, payload);
        else savedPerson = await addNewStudent(payload);
      } else {
        const payload = { name: formData.name, birth: formData.birth, sex: formData.sex, phone: formData.phone, teacherType: formData.teacherType, memo: formData.memo };
        if (isEditMode && initialData?.id) savedPerson = await updateTeacher(initialData.id, payload);
        else savedPerson = await addNewTeacher(payload);
      }

      const savedPersonId = Number(savedPerson?.id ?? initialData?.id);
      if (!Number.isFinite(savedPersonId)) {
        throw new Error("저장된 사용자의 ID를 확인할 수 없습니다.");
      }

      try {
        if (faceImageFile) {
          const faceImage = await uploadFaceImage(type, savedPersonId, faceImageFile);
          return { savedPersonId, faceImage, photoAction: "uploaded" as const };
        }

        if (isEditMode && removeFaceImage && currentHasFaceImage) {
          await deleteFaceImage(type, savedPersonId);
          return { savedPersonId, faceImage: null, photoAction: "deleted" as const };
        }
      } catch (error: unknown) {
        const photoErrorMessage = getPeopleErrorMessage(
          error,
          "얼굴 사진을 처리하지 못했습니다."
        );
        throw new FaceImageSaveError(
          `${isStudent ? "학생" : "선생님"} 정보는 저장되었지만 얼굴 사진 처리에 실패했습니다. ${photoErrorMessage}`
        );
      }

      return { savedPersonId, faceImage: null, photoAction: null };
    },
    onSuccess: ({ savedPersonId, faceImage, photoAction }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachersList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers() });

      if (photoAction === "uploaded" && faceImage) {
        queryClient.setQueryData(
          queryKeys.faceImage(type, savedPersonId),
          faceImage
        );
        setCurrentHasFaceImage(true);
        setFaceImageFile(null);
        setFaceImagePreview(null);
        setRemoveFaceImage(false);
      } else if (photoAction === "deleted") {
        queryClient.removeQueries({
          queryKey: queryKeys.faceImage(type, savedPersonId),
          exact: true,
        });
        setCurrentHasFaceImage(false);
        setRemoveFaceImage(false);
      }

      setAlertType("success");
      setAlertMessage(`${isStudent ? "학생" : "선생님"}이 성공적으로 ${isEditMode ? "수정" : "추가"}되었습니다.`);
      setAlertOpen(true);
      if (!asPanel) onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (error instanceof FaceImageSaveError) {
        queryClient.invalidateQueries({ queryKey: queryKeys.studentsList() });
        queryClient.invalidateQueries({ queryKey: queryKeys.teachersList() });
        queryClient.invalidateQueries({ queryKey: queryKeys.students() });
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers() });
        if (!isEditMode) onOpenChange(false);
      }
      setAlertType("error");
      setAlertMessage(getPeopleErrorMessage(error, `${isEditMode ? "수정" : "추가"}에 실패했습니다.`));
      setAlertOpen(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initialData) throw new Error("삭제할 사용자를 확인할 수 없습니다.");
      if (isStudent) await deleteStudent(initialData.id);
      else await deleteTeacher(initialData.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachersList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers() });
      setAlertType("success");
      setAlertMessage(`${isStudent ? "학생" : "선생님"}이 성공적으로 삭제되었습니다.`);
      setAlertOpen(true);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      setAlertType("error");
      setAlertMessage(getPeopleErrorMessage(error, "삭제에 실패했습니다."));
      setAlertOpen(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhoneChange = (field: "phone" | "parentPhone", value: string) => {
    const formatted = formatPhoneNumber(value)
    setFormData((prev) => ({ ...prev, [field]: formatted }))
  }

  const showFaceImageError = (message: string) => {
    setAlertType("error");
    setAlertMessage(message);
    setAlertOpen(true);
  }

  const handleFaceImageChange = async (file?: File) => {
    if (!file) return;

    if (!ALLOWED_FACE_IMAGE_TYPES.includes(file.type)) {
      showFaceImageError("얼굴 사진은 JPEG 또는 PNG 파일만 선택할 수 있습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FACE_IMAGE_SIZE) {
      showFaceImageError("얼굴 사진은 5MB 이하만 선택할 수 있습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve({ width: image.width, height: image.height });
          image.onerror = () => reject(new Error("invalid image"));
          image.src = previewUrl;
        }
      );

      if (
        dimensions.width > MAX_FACE_IMAGE_DIMENSION ||
        dimensions.height > MAX_FACE_IMAGE_DIMENSION
      ) {
        URL.revokeObjectURL(previewUrl);
        showFaceImageError("이미지 가로와 세로는 각각 4096px 이하여야 합니다.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } catch {
      URL.revokeObjectURL(previewUrl);
      showFaceImageError("읽을 수 없는 이미지 파일입니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFaceImageFile(file);
    setFaceImagePreview(previewUrl);
    setRemoveFaceImage(false);
  }

  const handleRemoveFaceImage = () => {
    if (faceImageFile) {
      setFaceImageFile(null);
      setFaceImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (currentHasFaceImage) {
      setRemoveFaceImage(true);
    }
  }

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  }

  const handleDeleteConfirm = () => {
    if (!isEditMode || !initialData?.id) return;
    deleteMutation.mutate();
  }

  useEffect(() => {
    if (open && initialData) {
      // 선택한 사용자에 맞춰 하나의 재사용 폼을 초기화한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

    if (open) {
      setCurrentHasFaceImage(Boolean(initialData?.hasFaceImage));
      setFaceImageFile(null);
      setFaceImagePreview(null);
      setRemoveFaceImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, initialData, type])

  useEffect(() => {
    return () => {
      if (faceImagePreview) URL.revokeObjectURL(faceImagePreview);
    };
  }, [faceImagePreview]);

  const displayedFaceImage =
    faceImagePreview ||
    (!removeFaceImage ? faceImageQuery.data?.url ?? null : null);

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="faceImage">얼굴 사진</Label>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-400">
              {displayedFaceImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayedFaceImage}
                  alt={`${formData.name || (isStudent ? "학생" : "선생님")} 얼굴 사진`}
                  className="h-full w-full object-cover"
                />
              ) : faceImageQuery.isFetching ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-medium text-gray-700">
                {faceImageFile
                  ? faceImageFile.name
                  : removeFaceImage
                    ? "저장하면 기존 사진이 삭제됩니다."
                    : currentHasFaceImage
                      ? "등록된 대표 사진"
                      : "대표 얼굴 사진을 등록해 주세요."}
              </p>
              <p className="mb-3 text-xs text-gray-400">
                JPEG 또는 PNG · 최대 5MB · 최대 4096px
              </p>

              {faceImageQuery.isError && !faceImageFile && !removeFaceImage && (
                <button
                  type="button"
                  onClick={() => faceImageQuery.refetch()}
                  className="mb-3 text-xs font-medium text-red-500 hover:underline"
                >
                  사진을 불러오지 못했습니다. 다시 시도
                </button>
              )}

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  id="faceImage"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={(event) => handleFaceImageChange(event.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="faceImage" className="cursor-pointer">
                    <ImagePlus className="h-4 w-4" />
                    {currentHasFaceImage || faceImageFile ? "사진 교체" : "사진 선택"}
                  </label>
                </Button>

                {(faceImageFile || (currentHasFaceImage && !removeFaceImage)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFaceImage}
                    className="text-gray-500 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    {faceImageFile ? "선택 취소" : "사진 삭제"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

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

      <div className="flex justify-between">
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
          disabled={submitMutation.isPending}
          className="bg-[#2C79FF] text-white hover:bg-[#2C79FF]/90 ml-auto"
        >
          {submitMutation.isPending ? "저장 중..." : isEditMode ? "수정하기" : "추가"}
        </Button>
      </div>
    </form>
  )

  return (
    <>
      {asPanel ? (
        <div className="bg-transparent p-6 h-full overflow-y-auto animate-in fade-in slide-in-from-right-6 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {isEditMode ? `${initialData.name} ${isStudent ? "학생" : "선생님"}` : (isStudent ? "새 학생" : "새 선생님")}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {formContent}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px] border-0 bg-[#F9F9FF] duration-300">
            <DialogHeader>
              <DialogTitle>{isEditMode ? (isStudent ? "학생 정보 수정" : "선생님 정보 수정") : (isStudent ? "새 학생" : "새 선생님")}</DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? (isStudent ? "학생 정보를 수정해주세요." : "선생님 정보를 수정해주세요.")
                  : (isStudent ? "새로운 학생 정보를 입력해주세요." : "새로운 선생님 정보를 입력해주세요.")}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
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
