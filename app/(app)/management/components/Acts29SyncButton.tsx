"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { RefreshCw } from "lucide-react";
import useAuthStore from "@/app/(shared)/(store)/authStore";
import useAttendanceStore from "@/app/(shared)/(store)/attendanceStore";
import { syncActs29Attendance, type Acts29SyncResponse } from "@/app/(shared)/(api)/acts29";
import { getStudentDailyAttendances } from "@/app/(shared)/(api)/attendance";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Acts29SyncButton() {
  const admin = useAuthStore((state) => state.admin);
  const selectedDate = useAttendanceStore((state) => state.selectedDate);
  const isSuperAdmin = admin?.role === "SUPER_ADMIN" && admin.approvalStatus === "APPROVED";
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [response, setResponse] = useState<Acts29SyncResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"compare" | "sync" | null>(null);
  const busyRef = useRef(false);

  const attendanceQuery = useQuery({
    queryKey: ["acts29-unmatched-attendance", response?.schoolYear, response?.date],
    queryFn: () => getStudentDailyAttendances(response!.schoolYear, response!.date),
    enabled: isSuperAdmin && open && !!response && response.matchIssues.length > 0,
    staleTime: 0,
  });
  const attendedStudentIds = new Set(
    (attendanceQuery.data ?? [])
      .filter((student) => student.attendanceStatus === "ATTEND" || student.attendanceStatus === "LATE")
      .map((student) => student.studentId)
  );
  const attendedMatchIssues = response?.matchIssues.filter((issue) => attendedStudentIds.has(issue.studentId)) ?? [];

  const execute = async (dryRun: boolean) => {
    if (!isSuperAdmin || busyRef.current || !date) return;
    if (!dryRun && (!response?.dryRun || response.date !== date || response.changedCount === 0)) return;
    busyRef.current = true;
    setBusy(dryRun ? "compare" : "sync");
    setError("");
    setResponse(null);
    try {
      setResponse(await syncActs29Attendance(date, dryRun));
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined;
      setError(typeof message === "string" ? message : "Acts29 출석 동기화 요청에 실패했습니다. 다시 비교해주세요.");
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { setDate(selectedDate); setResponse(null); setError(""); setOpen(true); }}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#2C79FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1B5FCC]"
      >
        <RefreshCw className="h-4 w-4" />Acts29 출석 동기화
      </button>
      <Dialog open={open} onOpenChange={(value) => { if (!busyRef.current) setOpen(value); }}>
        <DialogContent className="content-start overflow-y-auto sm:max-h-[calc(100dvh-2rem)] dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>Acts29 출석 동기화</DialogTitle>
            <DialogDescription>{date} · 전체 학생 출석을 Acts29와 비교하고 반영합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg bg-[#F2F4F6] dark:bg-gray-800 p-3 text-sm leading-relaxed text-[#697077] dark:text-gray-400">
            <p>이름·생년월일로 매칭된 학생의 출석을 반영합니다. 로컬에만 있거나 중복 매칭된 학생은 건너뛰며, Acts29에만 있는 학생의 기존 상태는 유지됩니다.</p>
            <p>출석·지각은 출석(Y), 결석·기타·미체크는 미출석(N)으로 반영합니다. 선생님 출석은 포함되지 않습니다.</p>
          </div>
          {busy && <p role="status" className="text-sm text-[#697077] dark:text-gray-400">{busy === "compare" ? "Acts29 출석을 비교하고 있습니다." : "Acts29에 출석을 반영하고 있습니다."} 잠시 기다려주세요.</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {response && (
            <div className="flex flex-col gap-4">
              <p role="status" className={`text-sm font-semibold ${response.dryRun ? "text-[#2C79FF]" : "text-green-700"}`}>
                {response.dryRun ? "출석 비교 완료" : response.result === "NO_CHANGES" ? "변경할 출석이 없습니다." : "매칭된 학생의 Acts29 출석 반영 완료"}
              </p>
              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-[#E8ECFF] p-3 text-sm">
                <div><dt className="text-[#697077] dark:text-gray-400">로컬 학생</dt><dd className="font-semibold">{response.localStudentCount}명</dd></div>
                <div><dt className="text-[#697077] dark:text-gray-400">매칭된 학생</dt><dd className="font-semibold">{response.matchedCount}명</dd></div>
                <div><dt className="text-[#697077] dark:text-gray-400">{response.dryRun ? "변경 예정" : "변경된 출석"}</dt><dd className="font-semibold">{response.changedCount}건</dd></div>
                <div><dt className="text-[#697077] dark:text-gray-400">{response.dryRun ? "건너뛸 학생" : "건너뛴 학생"}</dt><dd className="font-semibold">{response.unmatchedTargetCount}명</dd></div>
                <div><dt className="text-[#697077] dark:text-gray-400">매칭 문제</dt><dd className="font-semibold">{response.matchIssues.length}건</dd></div>
              </dl>
              {response.matchIssues.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-semibold">{response.date} 출석·지각 학생 중 ACTS29 미매칭</p>
                  {attendanceQuery.isError ? (
                    <div className="mt-2" role="alert">
                      <p>출석 기록을 불러오지 못했습니다. 미매칭 출석 학생을 확인할 수 없습니다.</p>
                      <button type="button" onClick={() => attendanceQuery.refetch()} className="mt-1 underline">다시 조회</button>
                    </div>
                  ) : attendanceQuery.isFetching ? (
                    <p className="mt-2" role="status">출석 기록을 확인하고 있습니다.</p>
                  ) : attendedMatchIssues.length > 0 ? (
                    <>
                      <p className="mt-1">{attendedMatchIssues.length}명 · {response.dryRun ? "아래 학생은 건너뛰고 매칭된 학생만 반영합니다." : "아래 학생은 반영에서 건너뛰었습니다."}</p>
                      <ul className="mt-2 max-h-32 overflow-y-auto space-y-1">{attendedMatchIssues.map((issue, index) => <li key={`${issue.studentId}-${index}`}>{issue.studentName} · {issue.reason}</li>)}</ul>
                    </>
                  ) : (
                    <p className="mt-2">출석·지각 학생 중 ACTS29에 매칭되지 않은 학생이 없습니다.</p>
                  )}
                </div>
              )}
              {response.changes.length > 0 && (
                <div className="max-h-48 overflow-auto rounded-lg border border-[#E8ECFF]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F2F4F6] dark:bg-gray-800"><tr><th className="p-2">학생</th><th className="p-2">반영 전 Acts29 출석</th><th className="p-2">{response.dryRun ? "반영할 출석" : "반영된 출석"}</th></tr></thead>
                    <tbody>{response.changes.map((change) => <tr key={`${change.studentId}-${change.targetUserId}`} className="border-t border-[#E8ECFF]"><td className="p-2">{change.studentName}</td><td className="p-2">{change.previousAttendance || "미입력"}</td><td className="p-2">{change.nextAttendance}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {response.dryRun && response.changedCount === 0 && <p className="text-sm text-[#697077] dark:text-gray-400">매칭된 학생 중 변경할 출석이 없습니다.</p>}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={!!busy} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">닫기</button>
            {(!response || response.dryRun) && <button type="button" onClick={() => execute(true)} disabled={!!busy} className="rounded-lg border border-[#2C79FF] px-4 py-2 text-sm text-[#2C79FF] disabled:opacity-50">{response ? "다시 비교" : "출석 비교"}</button>}
            {response?.dryRun && <button type="button" onClick={() => execute(false)} disabled={!!busy || response.changedCount === 0 || response.date !== date} className="rounded-lg bg-[#2C79FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Acts29에 반영</button>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
