"use client";

import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { changeMyPassword } from "@/app/(shared)/(api)/admin";
import useAuthStore from "@/app/(shared)/(store)/authStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeCookie } from "@/lib/utils";

export default function PasswordPage() {
  const admin = useAuthStore((state) => state.admin);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const submittingRef = useRef(false);

  const passwordError = !newPassword ? "" :
    !newPassword.trim() ? "공백만 입력할 수 없습니다." :
    newPassword.length < 8 || newPassword.length > 72 ? "비밀번호는 8~72자여야 합니다." :
    new TextEncoder().encode(newPassword).length > 72 ? "비밀번호는 UTF-8 기준 72바이트 이하여야 합니다." : "";
  const confirmationError = confirmation && confirmation !== newPassword ? "비밀번호가 일치하지 않습니다." : "";
  const canSubmit = !!currentPassword.trim() && !!newPassword && !passwordError && confirmation === newPassword;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const updatedAdmin = await changeMyPassword(currentPassword, newPassword);
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) useAuthStore.getState().setAuth(accessToken, updatedAdmin);
      removeCookie("refreshToken");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setCompleted(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === "INVALID_CREDENTIALS") {
        setError("현재 비밀번호가 올바르지 않습니다.");
      } else {
        const message = isAxiosError(error) ? error.response?.data?.message : undefined;
        setError(typeof message === "string" ? message : "비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const loginAgain = () => {
    // 전체 이동으로 메모리의 인증 정보와 계정 조회 캐시를 함께 초기화한다.
    window.location.replace("/");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-[#2C79FF]"><KeyRound className="h-4 w-4" />내 계정</div>
        <h1 className="text-2xl font-bold text-[#1B1C1E]">비밀번호 변경</h1>
        <p className="mt-2 text-sm text-[#697077]">{admin?.name} ({admin?.username}) 계정의 비밀번호를 변경합니다.</p>
      </div>
      <section className="rounded-2xl border border-[#E8ECFF] bg-white p-5 shadow-sm sm:p-6">
        {completed ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p role="status" className="font-semibold">비밀번호를 변경했습니다.</p>
            <p className="text-sm text-[#697077]">새 비밀번호로 다시 로그인해주세요.</p>
            <button type="button" onClick={loginAgain} className="rounded-lg bg-[#2C79FF] px-5 py-2.5 text-sm font-medium text-white">다시 로그인</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <p className="rounded-lg bg-[#F2F4F6] p-4 text-sm leading-relaxed text-[#697077]">현재 비밀번호를 확인한 후 변경합니다. 변경하면 모든 기기의 자동 로그인이 해제되며, 새 비밀번호로 다시 로그인해야 합니다.</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={submitting} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={submitting} aria-describedby="new-password-hint new-password-error" aria-invalid={!!passwordError} required />
              <p id="new-password-hint" className="text-xs leading-relaxed text-[#697077]">8~72자, UTF-8 기준 최대 72바이트 · 공백만 입력 불가 · 영문·숫자·특수문자 조합은 필수가 아닙니다.</p>
              <p id="new-password-error" aria-live="polite" className="text-xs text-red-600">{passwordError}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
              <Input id="new-password-confirm" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={submitting} aria-describedby="new-password-confirm-error" aria-invalid={!!confirmationError} required />
              <p id="new-password-confirm-error" aria-live="polite" className="text-xs text-red-600">{confirmationError}</p>
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={!canSubmit || submitting} className="self-end rounded-lg bg-[#2C79FF] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? "변경 중..." : "비밀번호 변경"}</button>
          </form>
        )}
      </section>
    </div>
  );
}
