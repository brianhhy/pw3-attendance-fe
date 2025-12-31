"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import useAttendanceStore from "../(store)/attendanceStore";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
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
        // 출석 체크 페이지에서만 학생/선생님 정보 가져오기
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
        // 출석 체크 페이지가 아니면 검색 결과 없음
        if (pathname !== "/" || !searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = [];

        // 학생 이름 검색
        students.forEach((student) => {
            if (student.name.toLowerCase().includes(query)) {
                const description = `중학교 ${student.schoolYear}학년 ${student.classRoomId}반 학생`;
                results.push({ 
                    id: student.id,
                    name: student.name, 
                    type: "student",
                    description: description
                });
            }
        });

        // 선생님 이름 검색
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

        return results.slice(0, 10); // 최대 10개만 표시
    }, [pathname, searchQuery, students, teachers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleResultClick = (result: SearchResult) => {
        setSearchQuery(result.name);
        setIsSearchFocused(false);
        
        // localStorage에 recentSearchItem 저장
        try {
            const recentSearchItem = {
                id: result.id,
                name: result.name,
                description: result.description,
                type: result.type,
                status: "before" as const,
            };

            // 기존 localStorage 데이터 가져오기
            const existingData = localStorage.getItem("recentSearchItems");
            let recentSearches: typeof recentSearchItem[] = [];
            
            if (existingData) {
                try {
                    recentSearches = JSON.parse(existingData);
                } catch (e) {
                    console.error("localStorage 데이터 파싱 오류:", e);
                    recentSearches = [];
                }
            }

            // 중복 제거 (같은 id와 type이면 제거)
            recentSearches = recentSearches.filter(
                (item) => !(item.id === recentSearchItem.id && item.type === recentSearchItem.type)
            );

            // 새로운 아이템을 맨 앞에 추가
            recentSearches.unshift(recentSearchItem);

            // 최대 10개만 유지
            recentSearches = recentSearches.slice(0, 10);

            // localStorage에 저장
            localStorage.setItem("recentSearchItems", JSON.stringify(recentSearches));
            console.log("[Header] recentSearchItem 저장 완료:", recentSearchItem);
            
            // 같은 탭에서 변경 감지를 위한 커스텀 이벤트 발생
            window.dispatchEvent(new Event("localStorageUpdate"));
            
            // attendanceStore에 selectedItem 설정하여 SelfAttendance 컴포넌트에 반영
            setSelectedItem(recentSearchItem);
        } catch (error) {
            console.error("[Header] localStorage 저장 중 오류 발생:", error);
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

    const handleDateSelect = (day: number) => {
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
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
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

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarMonth);
        const days = [];
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

        // 빈 칸 추가
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
        }

        // 날짜 추가
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
                        isSelected(day)
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
                        className="p-1 hover:bg-gray-100 rounded"
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
        <header className="flex flex-row relative">
            <div className="max-h-[127px] flex flex-row justify-between items-center w-full px-5">
                {/* 왼쪽: Title과 Description */}
                <div className="flex flex-col mt-5 flex-shrink-0">
                    <span className="text-[30px] font-bold text-[#2C79FF]">{descriptions[pathname === "/management" ? 1 : pathname === "/statistics" ? 2 : pathname === "/message" ? 3 : 0].title}</span>
                    <span className="text-[20px] font-medium">{descriptions[pathname === "/management" ? 1 : pathname === "/statistics" ? 2 : pathname === "/message" ? 3 : 0].description}</span>
                </div>

                {/* 중앙: 날짜 선택 컴포넌트 */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <button
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Calendar className="w-5 h-5 text-[#2C79FF]" />
                        <span className="text-lg font-medium text-[#2C79FF]">
                            {formatDate(selectedDate)}
                        </span>
                    </button>
                    {isCalendarOpen && (
                        <div ref={calendarRef} className="absolute top-12 z-50">
                            {renderCalendar()}
                        </div>
                    )}
                </div>

                {/* 오른쪽: 검색창 - 출석 체크 페이지에서만 표시 */}
                {pathname === "/" && (
                    <div className="relative flex flex-col flex-shrink-0">
                        <div className="flex flex-row items-center gap-2 border-b-2 border-[#2C79FF]">
                            <input 
                                type="text" 
                                placeholder="학생명, 선생님 이름 입력" 
                                className="w-[300px] h-[40px] p-2 focus:outline-none" 
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            <Search className="w-5 h-5 text-[#2C79FF]" />
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
                )}
            </div>
        </header>
    )
}

export default Header;