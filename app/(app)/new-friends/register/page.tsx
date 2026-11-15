"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Search, UserPlus, UserRound } from "lucide-react";
import { registerNewFriend, newFriendErrorMessage, type NewFriend } from "@/app/(shared)/(api)/newFriends";
import { getStudentsList } from "@/app/(shared)/(api)/student";
import { queryKeys } from "@/app/(shared)/(api)/queryKeys";
import { getTodayKST } from "@/app/(shared)/utils/dateUtil";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InvitingStudent {
  id: number;
  name: string;
  birth?: string | number[] | null;
  deletedAt?: string | null;
}

const fieldClass = "h-12 min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-base shadow-none transition-colors placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-visible:bg-slate-800 dark:focus-visible:ring-blue-900/50 md:text-sm";

function studentLabel(student: InvitingStudent) {
  const birth = Array.isArray(student.birth) ? student.birth.map((value, index) => String(value).padStart(index ? 2 : 4, "0")).join("-") : student.birth;
  return `${student.name}${birth ? ` · ${birth}` : ""}`;
}

export default function RegisterNewFriendPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [saved, setSaved] = useState<NewFriend | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const students = useQuery<InvitingStudent[]>({ queryKey: queryKeys.studentsList(), queryFn: getStudentsList, retry: false });
  const matchingStudents = (students.data ?? []).filter((student) => !student.deletedAt && student.name.includes(studentSearch.trim()));
  const selectedStudent = students.data?.find((student) => String(student.id) === studentId);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || !name.trim() || !birth || birth > getTodayKST()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const friend = await registerNewFriend({ name: name.trim(), birth, phone: phone.trim() || null, studentId: studentId ? Number(studentId) : null });
      setSaved(friend);
      await queryClient.invalidateQueries({ queryKey: ["new-friends"] });
      setName(""); setBirth(""); setPhone(""); setStudentId(""); setStudentSearch("");
    } catch (error) {
      setError(newFriendErrorMessage(error, "새친구 등록에 실패했습니다. 입력 내용을 확인하고 다시 시도해주세요."));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
      {saved ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div>
          <h2 role="status" className="text-lg font-bold">{saved.name} 친구를 등록했습니다.</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">등록된 친구 목록에서 정보를 확인할 수 있습니다.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setSaved(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">다른 새친구 등록</button>
            <Link href="/new-friends" className="rounded-xl bg-[#2C79FF] px-4 py-3 text-sm font-medium text-white">친구 목록 보기</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-8 sm:py-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2C79FF] dark:bg-blue-950/50"><UserPlus className="h-5 w-5" /></div>
            <div><h2 className="text-lg font-bold tracking-tight">새친구 등록</h2><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">함께 예배할 친구의 정보를 알려주세요.</p></div>
          </div>
          <div className="flex flex-col gap-7 p-5 sm:p-8">
            <fieldset disabled={submitting} className="min-w-0">
              <legend className="mb-4 flex w-full items-center justify-between gap-2 text-sm font-semibold">친구 정보<span className="text-xs font-normal text-slate-400"><span className="text-[#2C79FF]">*</span> 필수 입력</span></legend>
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-2">
                  <Label htmlFor="friend-name" className="text-sm font-medium text-slate-600 dark:text-slate-300">이름 <span className="text-[#2C79FF]">*</span></Label>
                  <Input id="friend-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required autoComplete="name" placeholder="친구 이름을 입력해주세요" className={fieldClass} />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <Label htmlFor="friend-birth" className="text-sm font-medium text-slate-600 dark:text-slate-300">생년월일 <span className="text-[#2C79FF]">*</span></Label>
                  <Input id="friend-birth" type="date" value={birth} onChange={(event) => setBirth(event.target.value)} max={getTodayKST()} required autoComplete="bday" className={`${fieldClass} block w-full max-w-full appearance-none dark:[color-scheme:dark] [&::-webkit-date-and-time-value]:min-h-[1.5em] [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0`} />
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="friend-phone" className="text-sm font-medium text-slate-600 dark:text-slate-300">연락처 <span className="ml-1 text-xs font-normal text-slate-400">선택</span></Label>
                  <Input id="friend-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={255} autoComplete="tel" placeholder="010-0000-0000" className={fieldClass} />
                </div>
              </div>
            </fieldset>
            <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
              <legend className="float-left mb-1 w-full text-sm font-semibold">초대한 학생 <span className="ml-1 text-xs font-normal text-slate-400">선택</span></legend>
              <p id="inviting-student-hint" className="text-xs text-slate-500 dark:text-slate-400">친구를 데려온 학생을 이름으로 찾아주세요.</p>
              <div className="relative">
                <Label htmlFor="inviting-student-search" className="sr-only">초대한 학생 검색</Label>
                <Search className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                <Input id="inviting-student-search" value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setStudentId(""); }} placeholder="학생 이름 검색" autoComplete="off" aria-describedby="inviting-student-hint" disabled={students.isPending || !!students.error} className={`${fieldClass} pl-10`} />
              </div>
              {selectedStudent && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300" role="status">
                  <span className="flex min-w-0 items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /><span className="break-all">{studentLabel(selectedStudent)}</span></span>
                  <button type="button" onClick={() => setStudentId("")} className="shrink-0 rounded-md px-1 py-1 text-xs hover:bg-blue-100 dark:hover:bg-blue-900">선택 해제</button>
                </div>
              )}
              {!students.isPending && !students.error && studentSearch.trim() && matchingStudents.length > 0 && (
                <ul aria-label="초대한 학생 검색 결과" className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                  {matchingStudents.map((student) => (
                    <li key={student.id}>
                      <button type="button" aria-label={studentLabel(student)} onClick={() => { setStudentId(String(student.id)); setStudentSearch(""); }} className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2C79FF] dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800"><UserRound className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block font-medium">{student.name}</span><span className="mt-0.5 block text-xs text-slate-400">{studentLabel(student).split(" · ")[1] || "생년월일 미등록"}</span></span>
                        <ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {students.isPending && <p className="text-xs text-slate-500">학생 목록을 불러오고 있습니다.</p>}
              {students.error && <p className="text-xs text-amber-700 dark:text-amber-400">학생 목록을 불러오지 못했습니다. 초대한 학생을 지정하지 않고 등록하거나 <button type="button" onClick={() => students.refetch()} className="underline">다시 조회</button>해주세요.</p>}
              {!students.isPending && !students.error && studentSearch.trim() && matchingStudents.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-500 dark:bg-slate-800">검색된 학생이 없습니다.</p>}
            </fieldset>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
          </div>
          <footer className="flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/20 sm:flex-row sm:px-8 sm:py-5">
            <Link href="/new-friends" className="text-xs text-slate-500 transition-colors hover:text-[#2C79FF] dark:text-slate-400">등록된 친구 보기</Link>
            <button type="submit" disabled={submitting || !name.trim() || !birth || birth > getTodayKST()} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#2C79FF] px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 sm:w-auto">{submitting ? "등록 중..." : "새친구 등록"}<ArrowRight className="h-4 w-4" /></button>
          </footer>
        </form>
      )}
    </section>
  );
}
