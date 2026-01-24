"use client";

import { useEffect, useMemo, useState } from "react";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import { getStudentRegistrationsByYear } from "../../(shared)/(api)/student";

type MonthlyStudent = {
  id: number;
  name: string;
  birth?: string | null;
  phone?: string | null;
  /**
   * 등록 월(1~12). 응답이 월별 버킷 형태로 오고 학생 객체에 날짜가 없을 때 사용.
   */
  registeredMonth?: number | null;
  /**
   * 월별 등록 학생 필터링 기준이 되는 날짜(ISO 문자열 등)
   * 현재 백엔드/스토어에 등록일 필드가 확정되어 있지 않아 optional로 둡니다.
   */
  registeredAt?: string | null;
};

function formatKoreanYearMonth(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return `${year}년 ${month}월`;
}

function toYearMonthValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function fromYearMonthValue(v: string) {
  const [y, m] = v.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
}

function buildRecentYearMonthOptions(base: Date, monthsBack: number) {
  // base(포함)부터 과거 monthsBack개월까지 옵션 생성
  const baseMonthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const opts: Array<{ value: string; label: string; date: Date }> = [];
  for (let i = 0; i <= monthsBack; i++) {
    const d = new Date(baseMonthStart.getFullYear(), baseMonthStart.getMonth() - i, 1);
    opts.push({ value: toYearMonthValue(d), label: formatKoreanYearMonth(d), date: d });
  }
  return opts;
}

function isSameYearMonth(dateStr: string, y: number, m1to12: number) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === y && d.getMonth() + 1 === m1to12;
}

function normalizeRegisteredAt(raw: any): string | null {
  const v =
    raw?.registeredAt ??
    raw?.registered_at ??
    raw?.createdAt ??
    raw?.created_at ??
    raw?.registrationDate ??
    raw?.registration_date ??
    raw?.registeredDate ??
    raw?.registered_date ??
    raw?.regDate ??
    raw?.reg_date ??
    raw?.date;
  if (!v) return null;
  // [YYYY, M, D] 형태도 지원
  if (Array.isArray(v) && v.length === 3) {
    const [y, m, d] = v;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeStudent(raw: any, monthHint?: number | null): MonthlyStudent | null {
  const id = raw?.id ?? raw?.studentId ?? raw?.student_id;
  const name = raw?.name ?? raw?.studentName ?? raw?.student_name;
  if (!id || !name) return null;
  return {
    id: Number(id),
    name: String(name),
    birth: raw?.birth ?? raw?.birthday ?? raw?.birthDay ?? raw?.birth_day ?? null,
    phone: raw?.phone ?? raw?.phoneNumber ?? raw?.phone_number ?? null,
    registeredAt: normalizeRegisteredAt(raw),
    registeredMonth: monthHint ?? raw?.month ?? raw?.registrationMonth ?? raw?.registration_month ?? null,
  };
}

function extractStudentsFromResponse(data: any): MonthlyStudent[] {
  // 1) [{ month: 1, students: [...] }, ...] 형태면 flatten
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] && "students" in data[0]) {
    const flat: MonthlyStudent[] = [];
    data.forEach((bucket: any) => {
      const monthHintRaw =
        bucket?.month ?? bucket?.registrationMonth ?? bucket?.registration_month ?? bucket?.registeredMonth ?? null;
      const monthHint =
        monthHintRaw === null || monthHintRaw === undefined ? null : Number(monthHintRaw);
      const arr = bucket?.students;
      if (Array.isArray(arr)) {
        arr.forEach((s: any) => {
          const ns = normalizeStudent(s, monthHint);
          if (ns) flat.push(ns);
        });
      }
    });
    return flat;
  }

  // 2) [student, student, ...] 형태
  if (Array.isArray(data)) {
    return data.map((s) => normalizeStudent(s, null)).filter(Boolean) as MonthlyStudent[];
  }

  // 3) { students: [...] } 또는 { data: [...] } 형태
  const maybeArr = data?.students ?? data?.data ?? data?.items ?? null;
  if (Array.isArray(maybeArr)) {
    return maybeArr.map((s: any) => normalizeStudent(s, null)).filter(Boolean) as MonthlyStudent[];
  }

  // 4) { "1": [...], "2": [...], ... } 처럼 월이 key인 형태
  if (data && typeof data === "object") {
    const flat: MonthlyStudent[] = [];
    Object.keys(data).forEach((k) => {
      const monthHint = Number(k);
      const arr = (data as any)[k];
      if (!Number.isNaN(monthHint) && Array.isArray(arr)) {
        arr.forEach((s: any) => {
          const ns = normalizeStudent(s, monthHint);
          if (ns) flat.push(ns);
        });
      }
    });
    if (flat.length > 0) return flat;
  }

  return [];
}

export default function MonthlyRegisteredStudents() {
  const { selectedDate } = useAttendanceStore();
  const yearMonthOptions = useMemo(() => buildRecentYearMonthOptions(new Date(), 12), []);
  const [monthDate, setMonthDate] = useState(() => {
    // 최신 월(현재 월)을 기본값으로
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [students, setStudents] = useState<MonthlyStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 다른 화면들과 선택 날짜를 공유하고 싶다면 selectedDate로 동기화할 수 있지만,
    // 이 컴포넌트는 상단 select로 월을 선택하는 UX를 사용하므로 기본값만 현재 월로 둡니다.
  }, [selectedDate]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getStudentRegistrationsByYear(year);
        const list = extractStudentsFromResponse(data);
        setStudents(list);
      } catch (e: any) {
        setError("신규 등록 학생 데이터를 불러오지 못했습니다.");
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [year]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (s.registeredAt) return isSameYearMonth(s.registeredAt, year, month);
      if (s.registeredMonth) return Number(s.registeredMonth) === month;
      return false;
    });
  }, [students, year, month]);

  return (
    <section className="w-full h-[450px] rounded-2xl border border-white/55 bg-gradient-to-br from-white/35 via-white/15 to-white/10 shadow-[0_10px_40px_rgba(31,38,135,0.18)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/25 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-semibold text-[#2C79FF] whitespace-nowrap">월별 등록 학생</h2>

        <div className="flex items-center gap-3">
          <select
            value={toYearMonthValue(monthDate)}
            onChange={(e) => {
              const next = fromYearMonthValue(e.target.value);
              if (next) setMonthDate(next);
            }}
            className="px-4 py-2 rounded-full bg-white/25 text-gray-900 font-semibold whitespace-nowrap ring-1 ring-white/45 backdrop-blur-xl backdrop-saturate-150 outline-none"
          >
            {yearMonthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="px-4 py-2 rounded-full bg-[#2C79FF] text-white font-semibold whitespace-nowrap">
            {filtered.length}명
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/45 bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-xl backdrop-saturate-150 overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-[64px_1fr_120px_1fr] bg-white/25 text-gray-900 font-semibold px-4 py-3 text-sm backdrop-blur-xl backdrop-saturate-150">
          <div>번호</div>
          <div>이름</div>
          <div>생년월일</div>
          <div>연락처</div>
        </div>

        <div className="flex-1 bg-white/10 backdrop-blur-xl backdrop-saturate-150 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500">로딩 중...</div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-gray-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              등록 학생이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-white/25">
              {filtered.map((s, idx) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[64px_1fr_120px_1fr] px-4 py-3 text-sm text-gray-900 hover:bg-white/15 transition-colors"
                >
                  <div className="text-gray-700">{idx + 1}</div>
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-gray-800">{s.birth ?? "-"}</div>
                  <div className="text-gray-800">{s.phone ?? "-"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

