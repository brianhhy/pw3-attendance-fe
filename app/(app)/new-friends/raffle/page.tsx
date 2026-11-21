"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Gift, RefreshCw, Search, Trophy } from "lucide-react";
import { getStudentDailyAttendances } from "@/app/(shared)/(api)/attendance";
import { getNewFriends, newFriendErrorMessage } from "@/app/(shared)/(api)/newFriends";
import { getTodayKST } from "@/app/(shared)/utils/dateUtil";
import { buildRaffleParticipants, drawParticipant, raffleResultsCsv, type RaffleWinner } from "@/lib/raffle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RaffleSession {
  excluded: string[];
  winners: RaffleWinner[];
}

const emptySession: RaffleSession = { excluded: [], winners: [] };
const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6";
const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700";

export default function FriendRafflePage() {
  const [date, setDate] = useState(getTodayKST);
  const [sessions, setSessions] = useState<Record<string, RaffleSession>>({});
  const [search, setSearch] = useState("");
  const [drawError, setDrawError] = useState("");
  const drawing = useRef(false);
  const students = useQuery({
    queryKey: ["raffle-attendance", date],
    queryFn: () => getStudentDailyAttendances(Number(date.slice(0, 4)), date),
    enabled: !!date, retry: false,
  });
  const friends = useQuery({ queryKey: ["new-friends"], queryFn: getNewFriends, retry: false });
  const session = sessions[date] ?? emptySession;
  const participants = buildRaffleParticipants(students.data ?? [], friends.data ?? []);
  const winnerIds = new Set(session.winners.map((winner) => winner.id));
  const excludedIds = new Set(session.excluded);
  const eligible = participants.filter((person) => !winnerIds.has(person.id) && !excludedIds.has(person.id));
  const filtered = participants.filter((person) => person.name.includes(search.trim()));
  const loading = students.isFetching || friends.isFetching;
  const error = students.error || friends.error;
  const ready = !!date && students.isSuccess && friends.isSuccess && !loading && !error;
  const lastRound = session.winners.at(-1)?.round ?? 0;
  const latestWinner = session.winners.at(-1);

  const toggleParticipant = (id: string) => {
    setSessions((previous) => {
      const current = previous[date] ?? emptySession;
      return { ...previous, [date]: { ...current, excluded: current.excluded.includes(id) ? current.excluded.filter((value) => value !== id) : [...current.excluded, id] } };
    });
  };

  const [wheel, setWheel] = useState<{ names: string[]; angle: number; spinning: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const draw = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (drawing.current || !ready || eligible.length === 0) return;
    drawing.current = true;
    setDrawError("");
    try {
      const winner = { ...drawParticipant(eligible), round: lastRound + 1 };
      const slot = eligible.findIndex((person) => person.id === winner.id);
      const target = 360 - (slot + 0.5) * 360 / eligible.length;
      const previousAngle = wheel?.angle ?? 0;
      const angle = previousAngle + 1080 + ((target - previousAngle % 360 + 360) % 360);
      setWheel({ names: eligible.map((person) => person.name), angle, spinning: true });
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer.current = setTimeout(() => {
        setSessions((previous) => {
          const current = previous[date] ?? emptySession;
          return { ...previous, [date]: { ...current, winners: [...current.winners, winner] } };
        });
        drawing.current = false;
        setWheel((current) => current && { ...current, spinning: false });
      }, reduced ? 0 : 2400);
    } catch {
      setDrawError("추첨하지 못했습니다. 다시 시도해주세요.");
      drawing.current = false;
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([raffleResultsCsv(date, session.winners)], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `친구초청예배_추첨결과_${date}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-5">
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Gift className="h-5 w-5 text-[#2C79FF]" />상품 추첨</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">예배에 참석한 학생과 초청 친구에게 선물을 전해요.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raffle-date">출석 날짜</Label>
              <Input disabled={wheel?.spinning} id="raffle-date" type="date" value={date} onChange={(event) => { setWheel(null); setDate(event.target.value); setSearch(""); setDrawError(""); }} className="w-auto dark:[color-scheme:dark]" />
            </div>
            <button type="button" disabled={loading || !date} onClick={() => { void students.refetch(); void friends.refetch(); }} className={secondaryButton}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />명단 새로고침</button>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm leading-relaxed text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">선택한 날짜의 출석·지각 학생과 전체 등록 초청 친구가 대상입니다. 선생님은 포함하지 않습니다. 초청 친구는 날짜 구분이 없으니 참석하지 않은 친구를 명단에서 제외해주세요.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{newFriendErrorMessage(error, "명단을 불러오지 못했습니다. 명단 새로고침을 눌러주세요.")} 전체 명단을 불러온 뒤 추첨할 수 있습니다.</p>}
        {loading && <p role="status" className="mt-3 text-sm text-slate-500">추첨 명단을 불러오고 있습니다.</p>}
        {!date && <p role="status" className="mt-3 text-sm text-slate-500">출석 날짜를 선택해주세요.</p>}
        {ready && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><span>출석 학생 <strong>{participants.filter((person) => person.source === "student").length}명</strong></span><span>초청 친구 <strong>{participants.filter((person) => person.source === "friend").length}명</strong></span><span className="text-[#2C79FF] dark:text-blue-300">추첨 가능 <strong>{eligible.length}명</strong></span><span className="text-slate-500">당첨 {session.winners.length}명</span></div>}
      </section>

      <section className={panel}>
        <NameWheel names={wheel?.names ?? eligible.map((person) => person.name)} angle={wheel?.angle ?? 0} winner={wheel && !wheel.spinning ? latestWinner : undefined} />
        <form onSubmit={draw} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <button type="submit" disabled={wheel?.spinning || !ready || eligible.length === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2C79FF] px-6 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"><Gift className="h-4 w-4" />한 명 뽑기</button>
        </form>
        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">모든 대상자는 동일한 확률로 추첨되며, 당첨자는 해당 날짜의 다음 추첨에서 자동 제외됩니다.</p>
        {ready && eligible.length === 0 && <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-400">추첨 가능한 대상자가 없습니다. 출석 현황과 명단 선택을 확인해주세요.</p>}
        {drawError && <p role="alert" className="mt-3 text-sm text-red-600">{drawError}</p>}
      </section>

      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">추첨 대상 명단</h3><p className="text-xs text-slate-500">체크를 해제하면 추첨에서 제외됩니다.</p></div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">동명이인은 별도 인원으로 유지합니다. 학생과 초청 친구에 같은 사람이 등록되어 있다면 한쪽을 제외해주세요.</p>
        <div className="relative mt-4"><Label htmlFor="raffle-search" className="sr-only">추첨 대상 이름 검색</Label><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="raffle-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이름 검색" className="pl-9" /></div>
        {ready && <ul className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">{filtered.map((person) => <li key={person.id}>
          <label className={`flex cursor-pointer items-center gap-3 py-3 ${winnerIds.has(person.id) || excludedIds.has(person.id) ? "opacity-50" : ""}`}>
            <input type="checkbox" checked={!excludedIds.has(person.id) && !winnerIds.has(person.id)} disabled={wheel?.spinning || winnerIds.has(person.id)} onChange={() => toggleParticipant(person.id)} className="h-4 w-4 shrink-0 accent-[#2C79FF]" />
            <span className="min-w-0 flex-1"><span className="break-all text-sm font-semibold">{person.name}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{person.detail}</span></span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{winnerIds.has(person.id) ? "당첨 완료" : person.source === "student" ? "출석 학생" : "초청 친구"}</span>
          </label>
        </li>)}{filtered.length === 0 && <li className="py-8 text-center text-sm text-slate-500">{search.trim() ? "검색 결과가 없습니다." : "추첨 대상자가 없습니다."}</li>}</ul>}
      </section>

      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{date || "선택 날짜"} 당첨 결과 · {session.winners.length}명</h3><button type="button" onClick={download} disabled={session.winners.length === 0} className={secondaryButton}><Download className="h-4 w-4" />결과 내려받기</button></div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">결과는 현재 화면에 머무는 동안 날짜별로 유지됩니다. 새로고침하거나 다른 메뉴로 이동하기 전에 결과를 내려받아주세요.</p>
        {session.winners.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">아직 추첨 결과가 없습니다.</p> : <ol className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{session.winners.map((winner) => <li key={winner.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><span className="mr-3 text-slate-500">{winner.round}회차</span><strong>{winner.name}</strong><span className="ml-2 text-xs text-slate-500">{winner.source === "student" ? "출석 학생" : "초청 친구"} · {winner.detail}</span></span></li>)}</ol>}
      </section>
    </div>
  );
}

function NameWheel({ names, angle, winner }: { names: string[]; angle: number; winner?: RaffleWinner }) {
  if (!names.length) return null;
  const colors = ["#2456a4", "#873b75", "#13726f", "#6949a6", "#a44726"];
  const step = 360 / names.length;
  const stops = names.map((_, i) => colors[i % colors.length] + " " + i * step + "deg " + (i + 1) * step + "deg");
  return (
    <div className="relative mx-auto mb-6 mt-2 aspect-square w-full max-w-72">
      <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 border-x-[10px] border-t-[22px] border-x-transparent border-t-amber-400 drop-shadow" />
      <div aria-hidden="true" className="relative h-full overflow-hidden rounded-full border-4 border-white shadow-lg motion-safe:transition-transform motion-safe:duration-[2400ms] motion-safe:ease-[cubic-bezier(.15,.7,.15,1)]" style={{ transform: `rotate(${angle}deg)`, background: names.length === 1 ? colors[0] : `conic-gradient(${stops.join(",")})` }}>
        {names.map((name, i) => <div key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${(i + 0.5) * step}deg)` }}>
          <span className="absolute top-[5%] max-h-[38%] overflow-hidden font-bold text-white [writing-mode:vertical-rl] [text-orientation:upright]" style={{ fontSize: Math.min(18, 490 / names.length) }}>{name}</span>
        </div>)}
        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-amber-400" />
      </div>
      <div role="status" aria-atomic="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        {winner && (
          <div className="w-3/4 rounded-2xl border-2 border-amber-300 bg-white px-4 py-4 text-center shadow-xl dark:bg-slate-900">
            <Trophy aria-hidden="true" className="mx-auto mb-1 h-6 w-6 text-amber-500" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{winner.round}회차 당첨!</p>
            <p className="mt-1 break-all text-2xl font-bold">{winner.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{winner.source === "student" ? "출석 학생" : "초청 친구"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
