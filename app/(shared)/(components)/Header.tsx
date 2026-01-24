"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import useAttendanceStore from "../(store)/attendanceStore";
import { getStudentAttendances } from "../(api)/attendance";

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
        title: "출석 체크",
        description: "이름을 검색 후 출석 체크를 완료하세요!",
    },
    {
        title: "관리",
        description: "새로운 학생과 선생님을 추가하고 출석 상태를 관리하세요!",
    },
    {
        title: "매칭",
        description: "새로운 학생과 선생님을 반에 배정하세요!",
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
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);
    
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
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
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
            days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const future = isFuture(day);
            days.push(
                <button
                    key={day}
                    onClick={() => !future && handleDateSelect(day)}
                    disabled={future}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
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
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[320px]">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-lg">
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
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdays.map((day) => (
                        <div key={day} className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-gray-600">
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
        <header className="flex flex-col relative bg-white z-50">
            <div className="flex flex-row justify-between items-center w-full px-5 py-5">
                <div className="flex flex-col flex-shrink-0">
                    <span className="text-[30px] font-bold text-[#2C79FF]">{descriptions[pathname === "/management" ? 1 : pathname === "/matching" ? 2 : pathname === "/statistics" ? 3 : pathname === "/message" ? 4 : 0].title}</span>
                    <span className="text-[20px] font-medium">{descriptions[pathname === "/management" ? 1 : pathname === "/matching" ? 2 : pathname === "/statistics" ? 3 : pathname === "/message" ? 4 : 0].description}</span>
                </div>

                <div className="flex-shrink-0 z-50">
                    <div className="relative">
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors relative z-50"
                        >
                            <Calendar className="w-5 h-5 text-[#2C79FF]" />
                            <span className="text-lg font-medium text-[#2C79FF]">
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

                {/* {pathname === "/" && (
                    <div className="relative flex flex-col flex-shrink-0">
                        <div className={`relative flex items-center overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
                            isSearchOpen || searchQuery ? "w-[300px]" : "w-10"
                        }`}>
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 text-[#2C79FF] hover:text-[#2C79FF] transition-colors"
                                aria-label="검색"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            <input 
                                type="text" 
                                placeholder="학생명, 선생님 이름 입력" 
                                className={`w-full h-[40px] pl-10 pr-2 bg-[#F7F8FF] border-none focus:outline-none transition-all duration-300 ${
                                    isSearchOpen || searchQuery ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => {
                                    setIsSearchFocused(true);
                                    setIsSearchOpen(true);
                                }}
                                onBlur={() => setTimeout(() => {
                                    setIsSearchFocused(false);
                                    if (!searchQuery) {
                                        setIsSearchOpen(false);
                                    }
                                }, 200)}
                            />
                        </div>
                        
                        {isSearchFocused && searchResults.length > 0 && (
                            <div className="absolute top-[42px] left-0 w-[300px] bg-gray-50 border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto mt-1">
                                {searchResults.map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg text-black">{result.name}</span>
                                            </div>
                                            {result.description && (
                                                <span className="text-sm text-gray-500">{result.description}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )} */}
            </div>
        </header>
    )
}

export default Header;