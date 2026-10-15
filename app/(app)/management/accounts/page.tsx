"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { KeyRound, Search, ShieldCheck } from "lucide-react";
import { getAdmins, resetAdminPassword, type AdminApplicant, type ApprovalStatus } from "@/app/(shared)/(api)/admin";
import useAuthStore from "@/app/(shared)/(store)/authStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const statusLabels: Record<ApprovalStatus, string> = {
  APPROVED: "승인 완료",
  PENDING: "승인 대기",
  REJECTED: "가입 거절",
};

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return "승인된 슈퍼 어드민만 처리할 수 있습니다.";
    if (error.response?.status === 404) return "계정을 찾을 수 없습니다. 목록을 새로고침해주세요.";
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AccountsPage() {
  const admin = useAuthStore((state) => state.admin);
  const isSuperAdmin = admin?.role === "SUPER_ADMIN" && admin.approvalStatus === "APPROVED";
  const [status, setStatus] = useState<ApprovalStatus>("APPROVED");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<AdminApplicant | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [resetError, setResetError] = useState("");
  const [notice, setNotice] = useState("");
  const { data = [], isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-accounts", status],
    queryFn: () => getAdmins(status),
    enabled: isSuperAdmin,
    retry: false,
  });

  const searchTerm = search.trim().toLowerCase();
  const accounts = data.filter((account) => account.role === "ADMIN" &&
    [account.name, account.username, account.email].some((value) => value.toLowerCase().includes(searchTerm)));
  const passwordError = password.length === 0 ? "" :
    !password.trim() ? "공백만 입력할 수 없습니다." :
    password.length < 8 || password.length > 72 ? "비밀번호는 8~72자여야 합니다." :
    new TextEncoder().encode(password).length > 72 ? "비밀번호는 UTF-8 기준 72바이트 이하여야 합니다." : "";
  const confirmationError = confirmation && password !== confirmation ? "비밀번호가 일치하지 않습니다." : "";
  const canSubmit = !!password && !passwordError && password === confirmation;

  const closeReset = () => {
    if (submittingRef.current) return;
    setTarget(null);
    setPassword("");
    setConfirmation("");
    setResetError("");
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSuperAdmin || !target || !canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setResetError("");
    try {
      await resetAdminPassword(target.id, password);
      setNotice(`${target.name} (${target.username}) 계정의 비밀번호를 초기화했습니다. 새 비밀번호를 사용자에게 전달해주세요.`);
      setTarget(null);
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setResetError(errorMessage(error, "비밀번호 초기화에 실패했습니다. 다시 시도해주세요."));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-[#697077] dark:text-gray-400" role="alert">승인된 슈퍼 어드민만 계정 관리 화면에 접근할 수 있습니다.</div>;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#2C79FF]"><ShieldCheck className="h-4 w-4" />슈퍼 어드민 전용</div>
        <h1 className="text-2xl font-bold text-[#1B1C1E] dark:text-gray-100">계정 관리</h1>
        <p className="mt-2 text-sm text-[#697077] dark:text-gray-400">일반 관리자 계정을 조회하고 새 비밀번호를 지정할 수 있습니다.</p>
      </div>
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      <section className="rounded-2xl border border-[#E8ECFF] dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100 p-4 shadow-sm sm:p-6" aria-label="관리자 계정 목록">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-status">가입 상태</Label>
            <select id="account-status" value={status} onChange={(event) => setStatus(event.target.value as ApprovalStatus)} className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm">
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="account-search">계정 검색</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="account-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이름, 아이디 또는 이메일 검색" />
            </div>
          </div>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="h-10 rounded-md border border-[#D9D9D9] px-4 text-sm disabled:opacity-50">새로고침</button>
        </div>
        {error ? (
          <p role="alert" className="py-8 text-center text-sm text-red-600">{errorMessage(error, "계정 목록을 불러오지 못했습니다. 새로고침해주세요.")}</p>
        ) : isPending ? (
          <p role="status" className="py-8 text-center text-sm text-[#697077] dark:text-gray-400">계정 목록을 불러오고 있습니다.</p>
        ) : accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#697077] dark:text-gray-400">{searchTerm ? "검색 결과가 없습니다." : "해당 상태의 일반 관리자 계정이 없습니다."}</p>
        ) : (
          <ul className="divide-y divide-[#E8ECFF]">
            {accounts.map((account) => (
              <li key={account.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{account.name}</span><span className="rounded-full bg-[#F2F4F6] dark:bg-gray-800 px-2 py-1 text-xs text-[#697077] dark:text-gray-400">{statusLabels[status]}</span></div>
                  <p className="mt-1 break-all text-sm text-[#697077] dark:text-gray-400">{account.username} · {account.email}</p>
                </div>
                <button type="button" onClick={() => { setNotice(""); setTarget(account); }} className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2C79FF] px-4 py-2 text-sm font-medium text-[#2C79FF] hover:bg-[#F7F8FF]">
                  <KeyRound className="h-4 w-4" />비밀번호 초기화
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Dialog open={!!target} onOpenChange={(open) => { if (!open) closeReset(); }}>
        <DialogContent className="content-start overflow-y-auto sm:max-h-[calc(100dvh-2rem)] dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" showCloseButton={!submitting}>
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription>{target?.name} ({target?.username}) 계정에 사용할 새 비밀번호를 입력하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <div className="rounded-lg bg-[#F2F4F6] dark:bg-gray-800 p-4 text-sm leading-relaxed text-[#697077] dark:text-gray-400">
              가입 승인 상태는 유지됩니다. 기존 비밀번호와 자동 로그인은 사용할 수 없게 됩니다. 현재 로그인은 최대 토큰 만료 시점까지 유지될 수 있습니다.
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-password">새 비밀번호</Label>
              <Input id="reset-password" type="password" autoComplete="new-password" value={password} disabled={submitting} onChange={(event) => setPassword(event.target.value)} aria-describedby="reset-password-hint reset-password-error" aria-invalid={!!passwordError} />
              <p id="reset-password-hint" className="text-xs leading-relaxed text-[#697077] dark:text-gray-400">8~72자, UTF-8 기준 최대 72바이트 · 공백만 입력 불가 · 영문·숫자·특수문자 조합은 필수가 아닙니다.</p>
              <p id="reset-password-error" aria-live="polite" className="text-xs text-red-600">{passwordError}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-password-confirm">새 비밀번호 확인</Label>
              <Input id="reset-password-confirm" type="password" autoComplete="new-password" value={confirmation} disabled={submitting} onChange={(event) => setConfirmation(event.target.value)} aria-describedby="reset-confirm-error" aria-invalid={!!confirmationError} />
              <p id="reset-confirm-error" aria-live="polite" className="text-xs text-red-600">{confirmationError}</p>
            </div>
            {resetError && <p role="alert" className="text-sm text-red-600">{resetError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeReset} disabled={submitting} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">취소</button>
              <button type="submit" disabled={!canSubmit || submitting} className="rounded-lg bg-[#2C79FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? "초기화 중..." : "비밀번호 초기화"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
