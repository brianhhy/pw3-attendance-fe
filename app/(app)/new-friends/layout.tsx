"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound } from "lucide-react";

export default function NewFriendsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><UsersRound className="h-5 w-5 text-[#2C79FF]" />친구초청예배</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">새로운 만남을 함께 기록해요.</p>
        </div>
        <nav aria-label="친구초청예배 메뉴" className="flex w-full gap-1 rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800 sm:w-auto">
          {[{ href: "/new-friends/register", label: "새친구 등록" }, { href: "/new-friends", label: "등록된 친구" }, { href: "/new-friends/raffle", label: "상품 추첨" }].map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2.5 text-center text-sm sm:px-4 font-medium transition-colors ${pathname === item.href ? "bg-white text-[#2C79FF] shadow-sm dark:bg-slate-700 dark:text-blue-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}>{item.label}</Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
