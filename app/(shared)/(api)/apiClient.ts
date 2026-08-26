import axios, { type InternalAxiosRequestConfig } from "axios";
import useAuthStore from "../(store)/authStore";
import { refresh } from "./auth";
import { getCookie, setCookie, removeCookie, epochSecondsToDate } from "@/lib/utils";

const apiClient = axios.create();

// 모든 요청에 accessToken이 있으면 Authorization 헤더를 붙인다.
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행되도록 진행 중인 재발급을 공유한다.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getCookie("refreshToken");
  if (!refreshToken) return null;

  try {
    const data = await refresh(refreshToken);
    // admin 정보는 메모리에만 있어 새로고침 시 사라지므로, 재발급 응답에 포함돼 있으면 함께 복원한다.
    if (data.admin) {
      useAuthStore.getState().setAuth(data.accessToken, data.admin);
    } else {
      useAuthStore.getState().setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      setCookie(
        "refreshToken",
        data.refreshToken,
        data.refreshTokenExpiresAt ? epochSecondsToDate(data.refreshTokenExpiresAt) : undefined
      );
    }
    return data.accessToken;
  } catch {
    return null;
  }
};

// 진행 중인 재발급이 있으면 그 결과를 공유하고, 없으면 새로 시작한다.
// 401 인터셉터와 세션 부트스트랩(Header)이 동시에 refresh를 호출해도 refreshToken이 중복 소모되지 않도록 한다.
export const ensureAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const forceLogout = () => {
  useAuthStore.getState().clearAuth();
  removeCookie("refreshToken");
  if (typeof window !== "undefined") {
    window.location.href = "/unauthorized";
  }
};

// 401 응답을 받으면 refreshToken으로 accessToken을 재발급받아 원래 요청을 한 번 재시도한다.
// 재발급 자체가 실패하거나, 재발급 후 재시도한 요청마저 401이면 세션을 정리하고 로그인 페이지로 보낸다.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // 재발급 후 재시도한 요청마저 401이면 더 손쓸 방법이 없으므로 바로 로그인 페이지로 보낸다.
    if (originalRequest._retry) {
      forceLogout();
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const newAccessToken = await ensureAccessToken();

    if (newAccessToken) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    }

    forceLogout();
    return Promise.reject(error);
  }
);

export default apiClient;
