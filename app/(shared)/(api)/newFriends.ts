import { isAxiosError } from "axios";
import apiClient from "./apiClient";

export interface NewFriend {
  id: number;
  name: string;
  birth: string;
  phone: string | null;
  studentId: number | null;
  studentName: string | null;
}

export interface NewFriendRequest {
  name: string;
  birth: string;
  phone: string | null;
  studentId: number | null;
}

type NewFriendResponse = Omit<NewFriend, "birth"> & { birth: string | [number, number, number] };

// 새친구 컨트롤러는 /api 접두사 없이 /new-friends에 매핑되어 있다.
const endpoint = `${(process.env.API_URL ?? "").replace(/\/$/, "").replace(/\/api$/, "")}/new-friends`;

const normalize = (friend: NewFriendResponse): NewFriend => ({
  ...friend,
  birth: Array.isArray(friend.birth)
    ? friend.birth.map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0")).join("-")
    : friend.birth,
});

export const getNewFriends = async (): Promise<NewFriend[]> => {
  const { data } = await apiClient.get<NewFriendResponse[]>(endpoint);
  return data.map(normalize);
};

export const registerNewFriend = async (request: NewFriendRequest): Promise<NewFriend> => {
  const { data } = await apiClient.post<NewFriendResponse>(endpoint, request);
  return normalize(data);
};

export const newFriendErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return "접근 권한이 없습니다. 로그인 계정을 확인해주세요.";
    if (typeof error.response?.data?.message === "string") return error.response.data.message;
  }
  return fallback;
};
