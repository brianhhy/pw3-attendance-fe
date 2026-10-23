import axios from "axios";
import { getDeviceInfo, getCookie } from "@/lib/utils";

interface LoginRequest {
  username: string;
  password: string;
  deviceInfo: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: number; // 초 단위 Unix epoch 타임스탬프
  refreshToken: string;
  refreshTokenExpiresAt: number; // 초 단위 Unix epoch 타임스탬프
  admin: {
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
  };
}

// 로그인 요청. 아이디/비밀번호와 함께 브라우저·OS 정보를 조합한 deviceInfo를 전송한다.
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const payload: LoginRequest = {
      username,
      password,
      deviceInfo: getDeviceInfo(),
    };

    const response = await axios.post(
      `${process.env.API_URL}/auth/login`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

interface SignupRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
}

// 회원가입 요청. 성공 시 201을 반환하며, 400(형식 오류)·409(아이디/이메일 중복)는 상황에 맞는 메시지로 변환하여 던진다.
export const signup = async (data: SignupRequest) => {
  try {
    const response = await axios.post(
      `${process.env.API_URL}/auth/signup`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (status === 400) {
      throw new Error(serverMessage || "입력하신 정보의 형식이 올바르지 않습니다.");
    }
    if (status === 409) {
      throw new Error(serverMessage || "이미 사용 중인 아이디 또는 이메일입니다.");
    }
    throw new Error(serverMessage || "회원가입에 실패했습니다.");
  }
};

interface LogoutRequest {
  refreshToken: string;
}

// 로그아웃 요청. 쿠키에 저장된 refreshToken을 함께 전송한다.
export const logout = async () => {
  try {
    const payload: LogoutRequest = {
      refreshToken: getCookie("refreshToken") ?? "",
    };

    const response = await axios.post(
      `${process.env.API_URL}/auth/logout`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

interface RefreshRequest {
  refreshToken: string;
  deviceInfo: string;
}

export interface RefreshResponse {
  accessToken: string;
  accessTokenExpiresAt?: number; // 초 단위 Unix epoch 타임스탬프
  refreshToken?: string;
  refreshTokenExpiresAt?: number; // 초 단위 Unix epoch 타임스탬프
  admin?: LoginResponse["admin"];
}

// accessToken 재발급 요청. accessToken 헤더 없이 refreshToken과 deviceInfo만 전송한다.
export const refresh = async (refreshToken: string): Promise<RefreshResponse> => {
  const payload: RefreshRequest = {
    refreshToken,
    deviceInfo: getDeviceInfo(),
  };

  const response = await axios.post(
    `${process.env.API_URL}/auth/refresh`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
