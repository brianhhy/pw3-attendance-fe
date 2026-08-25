import axios from "./apiClient";

export type FaceImageOwnerType = "student" | "teacher";

export interface FaceImageResponse {
  url: string;
  expiresAt: string;
}

const getFaceImagePath = (type: FaceImageOwnerType, id: number) => {
  const ownerPath = type === "student" ? "students" : "teacher";
  return `${process.env.NEXT_PUBLIC_API_URL}/${ownerPath}/${id}/face-image`;
};

// 학생 또는 선생님의 얼굴 사진을 조회할 수 있는 만료형 URL을 발급받는다.
export const getFaceImage = async (
  type: FaceImageOwnerType,
  id: number
): Promise<FaceImageResponse> => {
  const response = await axios.get<FaceImageResponse>(getFaceImagePath(type, id));
  return response.data;
};

// 얼굴 사진을 등록하거나 기존 사진을 교체한다.
export const uploadFaceImage = async (
  type: FaceImageOwnerType,
  id: number,
  file: File
): Promise<FaceImageResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.put<FaceImageResponse>(
    getFaceImagePath(type, id),
    formData
  );
  return response.data;
};

// 등록된 얼굴 사진을 삭제한다.
export const deleteFaceImage = async (
  type: FaceImageOwnerType,
  id: number
): Promise<void> => {
  await axios.delete(getFaceImagePath(type, id));
};
