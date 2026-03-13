"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Calendar, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import useAttendanceStore from "../(store)/attendanceStore";
import { getStudentAttendances } from "../(api)/attendance";
import { getBirthdays } from "../(api)/birth";
import MonthBirthday from "../(modal)/MonthBirthday";
import Sidebar from "./Sidebar";

interface Description{
    title: string;
    description: string;
}

interface SearchResult {
    id: number;
    name: string;
    type: "student" | "teacher";
    description: string;
}

const descriptions: Description[] = [
    {
        title: "출석 체크 페이지",
        description: "이름을 검색 후 출석 체크를 완료하세요!",
    },
    {
        title: "관리 페이지",
        description: "새로운 학생과 선생님을 추가하고 출석 상태를 관리하세요!",
    },
    {
        title: "매칭 페이지",
        description: "새로운 학생과 선생님을 반에 배정하세요!",
    },
    {
        title: "통계 페이지",
        description: "반별 출석률, 요일별 출석률과 같은 다양한 지표를 확인하세요!!",
    },
    {
        title: "메시지 페이지",
        description: "학생과 학부모에게 메시지를 보내보세요!",
    },
]


const Header = () => {

    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);
    const mobileCalendarRef = useRef<HTMLDivElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [birthdayList, setBirthdayList] = useState<{ name: string; label: string; day: number }[]>([]);
    const [currentBdayIndex, setCurrentBdayIndex] = useState(0);
    const [birthdayViewMonth, setBirthdayViewMonth] = useState(() => new Date().getMonth() + 1);
    const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
    
    const { 
        students, 
        teachers, 
        getStudents, 
        getTeachers, 
        selectedDate, 
        setSelectedDate, 
        getAttendances,
        setSelectedItem
    } = useAttendanceStore();

    useEffect(() => {
        if (pathname === "/") {
            getStudents();
            getTeachers();
        }
        getAttendances();
    }, [pathname, getStudents, getTeachers, getAttendances]);

    useEffect(() => {
        if (selectedDate) {
            setCalendarMonth(new Date(selectedDate));
        }
    }, [selectedDate]);

    useEffect(() => {
        getBirthdays(birthdayViewMonth)
            .then((data) => {
                const list: { name: string; label: string; day: number }[] = [];
                data.students.forEach((s) => {
                    list.push({ name: s.name, label: s.className, day: s.birth[2] });
                });
                data.teachers.forEach((t) => {
                    list.push({ name: t.name, label: "선생님", day: t.birth[2] });
                });
                list.sort((a, b) => a.day - b.day);
                setBirthdayList(list);
                setCurrentBdayIndex(0);
            })
            .catch(() => {});
    }, [birthdayViewMonth]);

    useEffect(() => {
        if (birthdayList.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBdayIndex((prev) => (prev + 1) % birthdayList.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [birthdayList.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const outsideDesktop = !calendarRef.current?.contains(event.target as Node);
            const outsideMobile = !mobileCalendarRef.current?.contains(event.target as Node);
            if (outsideDesktop && outsideMobile) {
                setIsCalendarOpen(false);
            }
        };

        if (isCalendarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCalendarOpen]);

    const searchResults = useMemo(() => {
        if (pathname !== "/" || !searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = [];

        students.forEach((student) => {
            if (student.name.toLowerCase().includes(query)) {
                const currentYear = "2025";
                const classes2025 = student.classesByYear?.[currentYear];
                let description = "학생";
                
                if (classes2025 && classes2025.length > 0) {
                    const classInfo = classes2025[0];
                    const schoolTypeName = classInfo.schoolType === "MIDDLE" ? "중학교" 
                        : classInfo.schoolType === "HIGH" ? "고등학교"
                        : classInfo.schoolType === "ELEMENTARY" ? "초등학교"
                        : "학교";
                    description = `${schoolTypeName} ${classInfo.grade}학년 ${classInfo.classNumber}반 학생`;
                }
                
                results.push({ 
                    id: student.id,
                    name: student.name, 
                    type: "student",
                    description: description
                });
            }
        });

        teachers.forEach((teacher) => {
            if (teacher.name.toLowerCase().includes(query)) {
                results.push({ 
                    id: teacher.id,
                    name: teacher.name, 
                    type: "teacher",
                    description: "선생님"
                });
            }
        });

        return results.slice(0, 10);
    }, [pathname, searchQuery, students, teachers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleResultClick = (result: SearchResult) => {
        setSearchQuery(result.name);
        setIsSearchFocused(false);
        
        try {
            const recentSearchItem = {
                id: result.id,
                name: result.name,
                description: result.description,
                type: result.type,
                status: "before" as const,
            };

            const existingData = localStorage.getItem("recentSearchItems");
            let recentSearches: typeof recentSearchItem[] = [];
            
            if (existingData) {
                try {
                    recentSearches = JSON.parse(existingData);
                } catch (e) {
                    recentSearches = [];
                }
            }

            recentSearches = recentSearches.filter(
                (item) => !(item.id === recentSearchItem.id && item.type === recentSearchItem.type)
            );

            recentSearches.unshift(recentSearchItem);

            recentSearches = recentSearches.slice(0, 5);

            localStorage.setItem("recentSearchItems", JSON.stringify(recentSearches));
            
            window.dispatchEvent(new Event("localStorageUpdate"));
            
            setSelectedItem(recentSearchItem);
        } catch (error) {
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
        const weekday = weekdays[date.getDay()];
        return `${year}년 ${month}월 ${day}일 (${weekday})`;
    };

    const getDaysInMonth = (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDateSelect = async (day: number) => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth() + 1;
        const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setSelectedDate(dateString);
        setIsCalendarOpen(false);
    };

    const handlePrevMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
        nextMonthStart.setHours(0, 0, 0, 0);
        
        if (nextMonthStart <= today) {
            setCalendarMonth(nextMonth);
        }
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return (
            today.getFullYear() === calendarMonth.getFullYear() &&
            today.getMonth() === calendarMonth.getMonth() &&
            today.getDate() === day
        );
    };

    const isSelected = (day: number): boolean => {
        const selected = new Date(selectedDate);
        return (
            selected.getFullYear() === calendarMonth.getFullYear() &&
            selected.getMonth() === calendarMonth.getMonth() &&
            selected.getDate() === day
        );
    };

    const isFuture = (day: number): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate > today;
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarMonth);
        const days = [];
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const future = isFuture(day);
            days.push(
                <button
                    key={day}
                    onClick={() => !future && handleDateSelect(day)}
                    disabled={future}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                        future
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected(day)
                            ? "bg-[#2C79FF] text-white font-bold"
                            : isToday(day)
                            ? "bg-gray-200 font-semibold"
                            : "hover:bg-gray-100"
                    }`}
                >
                    {day}
                </button>
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        const isNextMonthFuture = nextMonth > today;

        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[250px]">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-base">
                        {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                    </span>
                    <button
                        onClick={handleNextMonth}
                        disabled={isNextMonthFuture}
                        className={`p-1 rounded ${
                            isNextMonthFuture 
                                ? "opacity-30 cursor-not-allowed" 
                                : "hover:bg-gray-100"
                        }`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdays.map((day) => (
                        <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <>
            <header className="flex flex-col relative bg-white z-50">
                <div className="flex flex-row items-center w-full px-5 py-5 relative">
                    {/* lg 이상: 기존 레이아웃 */}
                    <div className="hidden lg:flex flex-row items-center gap-6">
                        <div className="flex flex-col items-center border-b border-[#d9d9d9] pb-2">
                            <Image src="/images/logo.png" alt="logo" width={171} height={80} />
                            <p className="text-[15px] font-medium text-[#2c79ff] mt-1 ml-5 whitespace-nowrap">서빙고 파워웨이브 3부 출석부</p>
                        </div>
                        <div className="flex flex-col ml-10">
                            <span className="text-[30px] font-bold text-[#2C79FF]">{descriptions[pathname.startsWith("/management") ? 1 : pathname === "/matching" ? 2 : pathname === "/statistics" ? 3 : pathname === "/message" ? 4 : 0].title}</span>
                            <span className="text-[20px] font-medium">{descriptions[pathname.startsWith("/management") ? 1 : pathname === "/matching" ? 2 : pathname === "/statistics" ? 3 : pathname === "/message" ? 4 : 0].description}</span>
                        </div>
                    </div>

                    {/* ===== lg 미만: 모바일 레이아웃 ===== */}
                    {/* 왼쪽: 로고 + title */}
                    <div className="lg:hidden flex items-center gap-2 shrink-0 min-w-0">
                        <Image src="/images/logo.png" alt="logo" width={60} height={28} className="shrink-0" />
                        <span className="max-[450px]:text-sm text-base font-bold text-[#2C79FF] truncate">
                            {descriptions[pathname.startsWith("/management") ? 1 : pathname === "/matching" ? 2 : pathname === "/statistics" ? 3 : pathname === "/message" ? 4 : 0].title}
                        </span>
                    </div>

                    {/* 중앙: 생일자 (flex-1으로 정중앙 배치) */}
                    <div className="lg:hidden flex-1 flex justify-center items-center">
                        <button
                            onClick={() => setIsBirthdayModalOpen(true)}
                            className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-pink-50 transition-colors"
                        >
                            <span className="text-sm">🎂</span>
                            <span className="text-xs font-semibold text-pink-400 whitespace-nowrap">{birthdayViewMonth}월</span>
                            {birthdayList.length > 0 ? (
                                <div className="overflow-hidden h-5 relative w-16">
                                    <span
                                        key={currentBdayIndex}
                                        className="absolute inset-0 flex items-center animate-birthday-ticker"
                                    >
                                        <span className="text-xs font-semibold text-[#2C79FF] whitespace-nowrap">
                                            {birthdayList[currentBdayIndex].name}
                                        </span>
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400">생일자</span>
                            )}
                        </button>
                    </div>

                    {/* 오른쪽: 달력 아이콘 + 메뉴 */}
                    <div className="lg:hidden flex items-center gap-0.5 shrink-0">
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Calendar className="w-5 h-5 text-[#2C79FF]" />
                            </button>
                            {isCalendarOpen && (
                                <div ref={mobileCalendarRef} className="absolute top-10 right-0 z-[99999]">
                                    {renderCalendar()}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="메뉴 열기"
                        >
                            <Menu className="w-6 h-6 text-[#2C79FF]" />
                        </button>
                    </div>

                    {/* 생일자 ticker - title~calendar 사이 정중앙 (lg 이상) */}
                    <div className="hidden lg:flex flex-1 justify-center items-center">
                        <button
                            onClick={() => setIsBirthdayModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-pink-50 transition-colors group"
                        >
                            <span className="text-sm">🎂</span>
                            <span className="text-xs font-semibold text-pink-400 whitespace-nowrap group-hover:text-pink-500">{birthdayViewMonth}월 생일자</span>
                            <div className="w-px h-3.5 bg-gray-200" />
                            {birthdayList.length > 0 ? (
                                <div className="overflow-hidden h-5 relative w-52">
                                    <span
                                        key={currentBdayIndex}
                                        className="absolute inset-0 flex items-center gap-1.5 animate-birthday-ticker"
                                    >
                                        <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                            {birthdayList[currentBdayIndex].day}일
                                        </span>
                                        <span className="text-xs font-semibold text-[#2C79FF] whitespace-nowrap">
                                            {birthdayList[currentBdayIndex].name}
                                        </span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            ({birthdayList[currentBdayIndex].label})
                                        </span>
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400">없음</span>
                            )}
                        </button>
                    </div>

                    {/* lg 이상: 달력 - 오른쪽 */}
                    <div className="hidden lg:flex flex-shrink-0 z-50">
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors relative z-50"
                            >
                                <Calendar className="w-4 h-4 text-[#2C79FF]" />
                                <span className="text-base font-medium text-[#2C79FF]">
                                    {formatDate(selectedDate)}
                                </span>
                            </button>
                            {isCalendarOpen && (
                                <div ref={calendarRef} className="absolute top-12 right-0 z-[99999]">
                                    {renderCalendar()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>


            </header>

            <MonthBirthday open={isBirthdayModalOpen} onOpenChange={setIsBirthdayModalOpen} initialMonth={birthdayViewMonth} />

            {/* 모바일 Sidebar 오버레이 - lg 이하 */}
            {isMobileMenuOpen && (
                <>
                    {/* 배경 오버레이 */}
                    <div
                        className="fixed inset-0 bg-black/50 z-[100] lg:hidden animate-fadeIn"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Sidebar - 오른쪽에서 슬라이드 */}
                    <div className="fixed top-0 right-0 h-full w-full z-[101] lg:hidden animate-slideInRight">
                        <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </>
            )}
        </>
    )
}

export default Header;