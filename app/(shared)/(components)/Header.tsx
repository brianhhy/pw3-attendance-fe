"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

interface Description{
    title: string;
    description: string;
}

const descriptions: Description[] = [
    {
        title: "출석 체크",
        description: "이름을 검색 후 출석 체크를 완료하세요!",
    },
    {
        title: "관리",
        description: "새로운 학생과 선생님을 추가하고 관리하세요!",
    },
    {
        title: "통계",
        description: "반별 출석률, 요일별 출석률과 같은 다양한 지표를 확인하세요!!",
    },
    {
        title: "메시지",
        description: "학생과 학부모에게 메시지를 보내보세요!",
    },
]

const Header = () => {

    const pathname = usePathname();
    
    return (
        <header className="flex flex-row">
            <div className="max-h-[127px]">
                <div className="flex flex-col ml-5 mt-5">
                    <span className="text-[30px] font-bold text-[#2C79FF]">{descriptions[pathname === "/management" ? 1 : pathname === "/statistics" ? 2 : pathname === "/message" ? 3 : 0].title}</span>
                    <span className="text-[20px] font-medium">{descriptions[pathname === "/management" ? 1 : pathname === "/statistics" ? 2 : pathname === "/message" ? 3 : 0].description}</span>
                </div>

                <div className=""></div>

            </div>
        </header>
    )
}

export default Header;