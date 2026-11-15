"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, UsersRound } from "lucide-react";
import { getNewFriends, newFriendErrorMessage } from "@/app/(shared)/(api)/newFriends";
import { Input } from "@/components/ui/input";

export default function NewFriendsPage() {
  const [search, setSearch] = useState("");
  const { data: friends = [], isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["new-friends"], queryFn: getNewFriends, retry: false,
  });
  const term = search.trim().toLocaleLowerCase();
  const filtered = friends.filter((friend) => [friend.name, friend.phone, friend.studentName].some((value) => value?.toLocaleLowerCase().includes(term)));

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">등록된 친구</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{!isPending && !error ? `전체 ${friends.length}명${term ? ` · 검색 결과 ${filtered.length}명` : ""}` : "전체 등록 명단"}</p>
        </div>
        <Link href="/new-friends/register" className="flex items-center gap-2 rounded-lg bg-[#2C79FF] px-4 py-2 text-sm font-medium text-white"><UserPlus className="h-4 w-4" />새친구 등록</Link>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="friend-search" className="sr-only">새친구 검색</label>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input id="friend-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="이름, 연락처 또는 초대한 학생 검색" />
        </div>
        <button type="button" disabled={isFetching} onClick={() => refetch()} className="rounded-lg border border-gray-300 px-3 text-sm disabled:opacity-50 dark:border-gray-700">새로고침</button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">행사 날짜와 관계없이 등록된 전체 새친구 명단입니다.</p>
      {error ? (
        <p role="alert" className="py-8 text-center text-sm text-red-600 dark:text-red-400">{newFriendErrorMessage(error, "친구 목록을 불러오지 못했습니다. 새로고침해주세요.")}</p>
      ) : isPending ? (
        <p role="status" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">친구 목록을 불러오고 있습니다.</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-gray-500 dark:text-gray-400">
          <UsersRound className="h-8 w-8" />
          <p className="text-sm">{term ? "검색 결과가 없습니다." : "아직 등록된 친구가 없습니다."}</p>
          {!term && <Link href="/new-friends/register" className="text-sm text-[#2C79FF] underline">첫 새친구 등록하기</Link>}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((friend) => (
            <li key={friend.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="break-all font-semibold">{friend.name}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">생년월일 {friend.birth}</p></div>
              <div className="flex flex-col gap-1 text-sm sm:text-right">
                <p className="break-all">{friend.phone || "연락처 미등록"}</p>
                <p className="text-gray-500 dark:text-gray-400">{friend.studentName ? `초대한 학생 · ${friend.studentName}` : "초대한 학생 미등록"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
