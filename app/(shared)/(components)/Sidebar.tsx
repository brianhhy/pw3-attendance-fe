"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Settings, BarChart, Mail, Users, X, LucideIcon } from "lucide-react";

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const menuItems: MenuItem[] = [
    { href: "/", label: "출석 체크", icon: ClipboardCheck },
    { href: "/management", label: "관리", icon: Settings },
    { href: "/statistics", label: "통계", icon: BarChart },
    { href: "/message", label: "메시지", icon: Mail },
];

interface SidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
    const pathname = usePathname();

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
                    const isActive = pathname === item.href;
                    return (
                        <div 
                            key={item.href} 
                            className={`flex-0.99 gap-[18px] px-[18px] rounded-[5px] hover:bg-[#F7F8FF] px-[10px] py-[10px] ${isActive ? 'bg-[#F7F8FF]' : ''}`}
                        >
                            <Link 
                                href={item.href}
                                onClick={() => {
                                    if (isMobile && onClose) {
                                        onClose();
                                    }
                                }}
                                className={`text-[20px] font-medium flex flex-row items-center gap-[18px] hover:text-[#2C79FF] group ${
                                    isActive ? 'text-[#2C79FF]' : 'text-[#697077]'
                                }`}
                            >
                                <Icon className={`w-[30px] h-[30px] ${isActive ? 'text-[#2C79FF]' : 'text-[#697077]'} group-hover:text-[#2C79FF]`} />
                                <span>{item.label}</span>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </aside>
    )
}

export default Sidebar;