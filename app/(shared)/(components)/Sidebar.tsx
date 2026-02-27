"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ClipboardCheck, Settings, BarChart, Mail, X, LucideIcon, ChevronDown, UserRound, CalendarCheck } from "lucide-react";

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
    subItems?: { href: string; label: string; icon: LucideIcon }[];
}

const menuItems: MenuItem[] = [
    { href: "/", label: "출석 체크", icon: ClipboardCheck },
    {
        href: "/management",
        label: "관리",
        icon: Settings,
        subItems: [
            { href: "/management/people", label: "사용자 관리", icon: UserRound },
            { href: "/management/attendance", label: "출결 관리", icon: CalendarCheck },
        ],
    },
    { href: "/statistics", label: "통계", icon: BarChart },
    { href: "/message", label: "메시지", icon: Mail },
];

interface SidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(
        pathname.startsWith("/management") ? "/management" : null
    );

    const toggleMenu = (href: string) => {
        setExpandedMenu((prev) => (prev === href ? null : href));
    };

    return (
        <aside className={`flex flex-col flex-shrink-0 h-screen gap-[12px] bg-white min-w-[250px] ${
            isMobile ? "w-full" : "hidden lg:flex min-w-[100px] pt-[12px]"
        }`}>
            {/* 모바일 헤더 - 로고, 문구, X 버튼 */}
            {isMobile && (
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <Image src="/images/logo.png" alt="logo" width={90} height={24} />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="메뉴 닫기"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
            )}
            <div className="flex-1 flex-col gap-[8px]">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const isExpanded = item.subItems && expandedMenu === item.href;

                    return (
                        <div key={item.href}>
                            <div
                                className={`rounded-[5px] hover:bg-[#F7F8FF] px-[10px] py-[10px] ${isActive ? "bg-[#F7F8FF]" : ""}`}
                            >
                                {item.subItems ? (
                                    /* 서브메뉴가 있으면 버튼으로 토글 */
                                    <button
                                        onClick={() => toggleMenu(item.href)}
                                        className={`w-full text-[20px] font-medium flex flex-row items-center gap-[18px] hover:text-[#2C79FF] group ${
                                            isActive ? "text-[#2C79FF]" : "text-[#697077]"
                                        }`}
                                    >
                                        <Icon className={`w-[30px] h-[30px] ${isActive ? "text-[#2C79FF]" : "text-[#697077]"} group-hover:text-[#2C79FF]`} />
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
                                        className={`text-[20px] font-medium flex flex-row items-center gap-[18px] hover:text-[#2C79FF] group ${
                                            isActive ? "text-[#2C79FF]" : "text-[#697077]"
                                        }`}
                                    >
                                        <Icon className={`w-[30px] h-[30px] ${isActive ? "text-[#2C79FF]" : "text-[#697077]"} group-hover:text-[#2C79FF]`} />
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>

                            {/* 서브메뉴 */}
                            {item.subItems && isExpanded && (
                                <div className="ml-[10px] border-l-2 border-[#E8ECFF] pl-2 mt-1 mb-1 flex flex-col gap-[2px]">
                                    {item.subItems.map((sub) => {
                                        const SubIcon = sub.icon;
                                        const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                                        return (
                                            <div
                                                key={sub.href}
                                                className={`rounded-[5px] hover:bg-[#F7F8FF] px-[10px] py-[8px] ${isSubActive ? "bg-[#F7F8FF]" : ""}`}
                                            >
                                                <Link
                                                    href={sub.href}
                                                    onClick={() => {
                                                        if (isMobile && onClose) onClose();
                                                    }}
                                                    className={`text-[16px] font-medium flex flex-row items-center gap-[12px] hover:text-[#2C79FF] group ${
                                                        isSubActive ? "text-[#2C79FF]" : "text-[#697077]"
                                                    }`}
                                                >
                                                    <SubIcon className={`w-[22px] h-[22px] ${isSubActive ? "text-[#2C79FF]" : "text-[#697077]"} group-hover:text-[#2C79FF]`} />
                                                    <span>{sub.label}</span>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default Sidebar;
