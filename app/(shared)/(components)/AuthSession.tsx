"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentAdmin } from "../(api)/admin";
import useAuthStore from "../(store)/authStore";

export default function AuthSession({ children }: { children: React.ReactNode }) {
  const { admin, setAuth } = useAuthStore();
  const { data, isError, refetch } = useQuery({
    queryKey: ["current-admin"],
    queryFn: getCurrentAdmin,
    enabled: !admin,
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });

  useEffect(() => {
    const accessToken = useAuthStore.getState().accessToken;
    if (data && accessToken) setAuth(accessToken, data);
  }, [data, setAuth]);

  if (!admin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-[#697077]">
        <p role="status">{isError ? "로그인 정보를 불러오지 못했습니다." : "로그인 정보를 확인하고 있습니다."}</p>
        {isError && <button onClick={() => refetch()} className="text-[#2C79FF] underline">다시 시도</button>}
      </div>
    );
  }

  return children;
}
