"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, ClipboardCheck, Settings, BarChart, X, LucideIcon, ChevronDown, UserRound, CalendarCheck, Users, UserStar, FileText, LogOut } from "lucide-react";
import { getTodayKST } from "../utils/dateUtil";
import { logout } from "../(api)/auth";
import useAuthStore from "../(store)/authStore";
import { removeCookie } from "@/lib/utils";

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
    subItems?: MenuItem[];
}

const baseMenuItems: MenuItem[] = [
    { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
    { href: "/attendance", label: "출석 체크", icon: ClipboardCheck },
    {
        href: "/management",
        label: "관리",
        icon: Settings,
        subItems: [
            {
                href: "/management/people",
                label: "사용자 관리",
                icon: UserRound,
                subItems: [
                    { href: "/management/people/student", label: "학생", icon: Users },
                    { href: "/management/people/teacher", label: "선생님", icon: UserStar },
                ],
            },
            {
                href: "/management/attendance",
                label: "출결 관리",
                icon: CalendarCheck,
                subItems: [
                    { href: "/management/attendance/student", label: "학생", icon: Users },
                    { href: "/management/attendance/teacher", label: "선생님", icon: UserStar },
                ],
            },
        ],
    },
    { href: "/statistics", label: "통계", icon: BarChart },
    { href: "/monthly-report", label: "월별 보고서", icon: FileText },
    // { href: "/message", label: "메시지", icon: Mail },
];

interface SidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const { clearAuth } = useAuthStore();
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (pathname.startsWith("/management")) initial.add("/management");
        if (pathname.startsWith("/management/people")) initial.add("/management/people");
        if (pathname.startsWith("/management/attendance")) initial.add("/management/attendance");
        return initial;
    });
    const [showParentsMenu, setShowParentsMenu] = useState(false);
    useEffect(() => {
        try {
            const raw = localStorage.getItem("pw3_event");
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const events = Array.isArray(parsed) ? parsed : [parsed];
            const today = getTodayKST();
            const hasToday = events.some(
                (e: { date: string; type: string }) =>
                    e.date === today && e.type === "parents_observation"
            );
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowParentsMenu(hasToday);
        } catch {
            // ignore invalid data
        }
    }, []);

    const menuItems = showParentsMenu
        ? [baseMenuItems[0], { href: "/parent-attendance", label: "부모님 출석체크", icon: Users }, ...baseMenuItems.slice(1)]
        : baseMenuItems;

    const toggleMenu = (href: string) => {
        setExpandedMenus((prev) => {
            const next = new Set(prev);
            if (next.has(href)) next.delete(href);
            else next.add(href);
            return next;
        });
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            // 로그아웃 API 요청이 실패해도 클라이언트 로그인 상태는 정리한다.
        } finally {
            clearAuth();
            removeCookie("refreshToken");
            if (isMobile && onClose) onClose();
            router.push("/");
        }
    };

    const renderMenuItems = (items: MenuItem[], depth: number) => {
        const iconSize = depth === 0 ? "w-[30px] h-[30px]" : depth === 1 ? "w-[22px] h-[22px]" : "w-[18px] h-[18px]";
        const textSize = depth === 0 ? "text-[20px]" : depth === 1 ? "text-[16px]" : "text-[14px]";
        const gap = depth === 0 ? "gap-[18px]" : depth === 1 ? "gap-[12px]" : "gap-[10px]";
        const padY = depth === 0 ? "py-[10px]" : "py-[8px]";

        return (
            <div className={depth === 0 ? "flex flex-col gap-[8px]" : "ml-[10px] border-l-2 border-[#E8ECFF] dark:border-gray-700 pl-2 mt-1 mb-1 flex flex-col gap-[2px]"}>
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const hasSubItems = !!item.subItems?.length;
                    const isExpanded = hasSubItems && expandedMenus.has(item.href);

                    return (
                        <div key={item.href}>
                            <div
                                className={`rounded-[5px] hover:bg-[#F7F8FF] dark:hover:bg-gray-800 px-[10px] ${padY} ${isActive ? "bg-[#F7F8FF] dark:bg-gray-800" : ""}`}
                            >
                                {hasSubItems ? (
                                    /* 서브메뉴가 있으면 버튼으로 토글 */
                                    <button
                                        onClick={() => toggleMenu(item.href)}
                                        className={`w-full ${textSize} font-medium flex flex-row items-center ${gap} hover:text-[#2C79FF] group ${
                                            isActive ? "text-[#2C79FF]" : "text-[#697077] dark:text-gray-400"
                                        }`}
                                    >
                                        <Icon className={`${iconSize} ${isActive ? "text-[#2C79FF]" : "text-[#697077] dark:text-gray-400"} group-hover:text-[#2C79FF]`} />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "" : "rotate-180"}`}
                                        />
                                    </button>
                                ) : (
                                    /* 서브메뉴가 없으면 링크 */
                                    <Link
                                        href={item.href}
                                        onClick={() => {
                                            if (isMobile && onClose) onClose();
                                        }}
                                        className={`${textSize} font-medium flex flex-row items-center ${gap} hover:text-[#2C79FF] group ${
                                            isActive ? "text-[#2C79FF]" : "text-[#697077] dark:text-gray-400"
                                        }`}
                                    >
                                        <Icon className={`${iconSize} ${isActive ? "text-[#2C79FF]" : "text-[#697077] dark:text-gray-400"} group-hover:text-[#2C79FF]`} />
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>

                            {/* 서브메뉴 */}
                            {hasSubItems && isExpanded && renderMenuItems(item.subItems!, depth + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <aside className={`flex flex-col flex-shrink-0 border-r border-[#D9D9D9] dark:border-gray-800 min-w-[250px] dark:bg-gray-900 ${
            isMobile ? "w-full h-screen bg-white" : "hidden lg:flex min-w-[100px] h-screen"
        }`}>
            {/* 데스크탑 로고 */}
            {!isMobile && (
                <div className="flex items-center justify-center gap-2 py-4">
                    <Image src="/images/logo.png" alt="logo" width={90} height={42} priority />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#2C79FF] whitespace-nowrap">파워웨이브 3부</span>
                        <span className="text-sm font-bold text-[#697077] whitespace-nowrap">출석부</span>
                    </div>
                </div>
            )}

            {/* 모바일 헤더 - 로고, X 버튼 */}
            {isMobile && (
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <Image src="/images/logo.png" alt="logo" width={90} height={24} />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="메뉴 닫기"
                    >
                        <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto px-[4px]">
                {renderMenuItems(menuItems, 0)}
            </div>

            <div className="border-t border-[#D9D9D9] dark:border-gray-800 px-[4px] py-[8px]">
                <button
                    onClick={handleLogout}
                    className="w-full rounded-[5px] hover:bg-[#F7F8FF] dark:hover:bg-gray-800 px-[10px] py-[10px] text-[20px] font-medium flex flex-row items-center gap-[18px] text-[#697077] dark:text-gray-400 hover:text-[#2C79FF] group"
                >
                    <LogOut className="w-[30px] h-[30px] text-[#697077] dark:text-gray-400 group-hover:text-[#2C79FF]" />
                    <span>로그아웃</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
