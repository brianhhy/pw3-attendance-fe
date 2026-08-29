"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudentRegistrationsByYear } from "../../../(shared)/(api)/student";
import { queryKeys } from "../../../(shared)/(api)/queryKeys";

type RegisteredStudent = {
  id: number;
  name: string;
  birth: string | null;
  phone: string | null;
};

type MonthBucket = { month: number; students?: Record<string, unknown>[] };

// 백엔드가 학생 필드명을 통일하지 않아(name/studentName 등) 여러 후보 키를 방어적으로 시도한다.
function normalizeStudent(raw: Record<string, unknown>): RegisteredStudent | null {
  const id = raw.id ?? raw.studentId ?? raw.student_id;
  const name = raw.name ?? raw.studentName ?? raw.student_name;
  if (id == null || !name) return null;
  return {
    id: Number(id),
    name: String(name),
    birth: (raw.birth ?? raw.birthday ?? raw.birthDay ?? raw.birth_day ?? null) as string | null,
    phone: (raw.phone ?? raw.phoneNumber ?? raw.phone_number ?? null) as string | null,
  };
}

function formatKoreanYearMonth(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function toYearMonthValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fromYearMonthValue(v: string) {
  const [y, m] = v.split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
}

function buildRecentYearMonthOptions(base: Date, monthsBack: number) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  return Array.from({ length: monthsBack + 1 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() - i, 1);
    return { value: toYearMonthValue(d), label: formatKoreanYearMonth(d), date: d };
  });
}

export default function MonthlyRegisteredStudents() {
  const yearMonthOptions = useMemo(() => buildRecentYearMonthOptions(new Date(), 12), []);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;

  const {
    data: buckets = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.monthlyStudents(year),
    queryFn: async () => {
      const data = await getStudentRegistrationsByYear(year);
      return Array.isArray(data) ? (data as MonthBucket[]) : [];
    },
  });

  const filtered = useMemo(() => {
    const bucket = buckets.find((b) => Number(b.month) === month);
    const raw = bucket?.students ?? [];
    return raw.map(normalizeStudent).filter((s): s is RegisteredStudent => s !== null);
  }, [buckets, month]);

  return (
    <div className="w-full h-full rounded-2xl border border-blue-100/70 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl p-4 sm:p-6 flex flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">신규 등록 학생</h2>

        <select
          value={toYearMonthValue(monthDate)}
          onChange={(e) => {
            const next = fromYearMonthValue(e.target.value);
            if (next) setMonthDate(next);
          }}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-[#2C79FF] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {yearMonthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-[260px] flex-1 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700/50">
        <div className="hidden gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700/50 dark:bg-gray-800/60 dark:text-gray-400 sm:grid sm:grid-cols-[48px_1fr_120px_1fr]">
          <div>번호</div>
          <div>이름</div>
          <div>생년월일</div>
          <div>연락처</div>
        </div>

        <div className="scrollbar-transparent-track max-h-[260px] overflow-y-auto">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</div>
          ) : isError ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              신규 등록 학생 데이터를 불러오지 못했습니다.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              등록된 학생이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/40">
              {filtered.map((s, idx) => (
                <li
                  key={s.id}
                  className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 sm:grid sm:grid-cols-[48px_1fr_120px_1fr] sm:items-center sm:gap-2 sm:px-4 sm:py-3"
                >
                  <div className="flex items-center justify-between gap-2 sm:contents">
                    <span className="hidden text-gray-400 dark:text-gray-500 sm:block">{idx + 1}</span>
                    <span className="truncate font-medium text-gray-900 dark:text-gray-50">
                      <span className="text-gray-400 dark:text-gray-500 sm:hidden">{idx + 1}. </span>
                      {s.name}
                    </span>
                    <span className="hidden text-gray-500 dark:text-gray-400 sm:block">{s.birth ?? "-"}</span>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 sm:hidden">{s.birth ?? "-"}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:mt-0 sm:truncate sm:text-sm">
                    {s.phone ?? "-"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
