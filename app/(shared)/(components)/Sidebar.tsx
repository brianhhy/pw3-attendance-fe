"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Settings, BarChart, Mail, Users, Share,LucideIcon} from "lucide-react";

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const menuItems: MenuItem[] = [
    { href: "/", label: "출석 체크", icon: ClipboardCheck },
    { href: "/management", label: "관리", icon: Users },
    { href: "/statistics", label: "통계", icon: BarChart },
    { href: "/message", label: "메시지", icon: Mail },
];

const Sidebar = () => {
    
    const pathname = usePathname();

    return (
        <aside className="flex flex-col max-w-[300px] h-screen gap-[12px]">
            <div className="flex flex-col items-center justify-center gap-[12px]">
                <Image src="/images/logo.png" alt="logo" width={171} height={80} />
                <p className="text-2xl font-medium text-[#2c79ff] text-[15px]">서빙고 파워웨이브 3부 출석부</p>
                <div className="border-b border-[#ECEDFF] w-full"></div>
            </div>

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

            <div className="px-[18px] py-[10px]">
                <button className="w-full px-[15px] py-[10px] rounded-[5px] bg-[#B3CFFF] text-white text-[25px] font-medium hover:bg-[#2C79FF] transition-colors flex flex-row items-center justify-center gap-[8px]">
                    <Share className="w-[25px] h-[25px]" />
                    <p>출석부 내보내기</p>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar;