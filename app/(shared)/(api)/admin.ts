import axios from "./apiClient";
import type { LoginResponse } from "./auth";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const getCurrentAdmin = async (): Promise<LoginResponse["admin"]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`);
  return response.data;
};

export interface AdminApplicant {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  approvalStatus: string;
  approvedById: number | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

// 상태를 생략하면 승인 대기 중인 계정을 조회한다.
export const getAdmins = async (status: ApprovalStatus = "PENDING"): Promise<AdminApplicant[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/admins`, {
    params: { status },
  });
  return response.data;
};

export const resetAdminPassword = async (id: number, newPassword: string): Promise<void> => {
  await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/admins/${id}/password-reset`, {
    newPassword,
  });
};

export const changeMyPassword = async (currentPassword: string, newPassword: string): Promise<LoginResponse["admin"]> => {
  const profile = await getCurrentAdmin();
  const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
    currentPassword,
    newPassword,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
  });
  return response.data;
};

// 관리자 가입 신청을 승인한다.
export const approveAdmin = async (id: number) => {
  const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/admins/${id}/approve`);
  return response.data;
};

// 관리자 가입 신청을 거절한다.
export const rejectAdmin = async (id: number) => {
  const response = await axios.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/super-admin/admins/${id}/reject`,
    { reason: "관리자 마음" }
  );
  return response.data;
};
