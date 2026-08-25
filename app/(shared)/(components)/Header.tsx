"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Calendar, ChevronLeft, ChevronRight, Menu, X, Sparkles, Bell, ShieldUser, User } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import useAttendanceStore from "../(store)/attendanceStore";
import useAuthStore from "../(store)/authStore";
import useThemeStore from "../(store)/themeStore";
import { getAdmins, approveAdmin, rejectAdmin, type AdminApplicant } from "../(api)/admin";
import Sidebar from "./Sidebar";
import Alert from "../(modal)/Alert";
import ThemeToggle from "./ThemeToggle";

const Chating = dynamic(() => import("../(modal)/Chating"), { ssr: false });

interface SearchResult {
    id: number;
    name: string;
    type: "student" | "teacher";
    description: string;
    destination: "attendance" | "management" | "management-attendance";
    breadcrumb: string;
}


const Header = () => {

    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isAiClosing, setIsAiClosing] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);
    const mobileCalendarRef = useRef<HTMLDivElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [admins, setAdmins] = useState<AdminApplicant[]>([]);
    const [isAdminsLoading, setIsAdminsLoading] = useState(false);
    const [processingAdminId, setProcessingAdminId] = useState<number | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<"success" | "error">("success");
    const [alertMessage, setAlertMessage] = useState("");
    const notificationRef = useRef<HTMLDivElement>(null);
    const mobileNotificationRef = useRef<HTMLDivElement>(null);
    const pendingAdmins = useMemo(
        () => admins.filter((admin) => admin.approvalStatus === "PENDING"),
        [admins]
    );
    
    const {
        students,
        teachers,
        getStudents,
        getTeachers,
        selectedDate,
        setSelectedDate,
        getAttendances,
        setSelectedItem,
        setHeaderSearch,
    } = useAttendanceStore();

    const { admin } = useAuthStore();
    const { syncTheme } = useThemeStore();

    useEffect(() => {
        syncTheme();
    }, [syncTheme]);

    useEffect(() => {
        if (pathname === "/attendance") {
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

    useEffect(() => {
        const handleClickOutsideNotification = (event: MouseEvent) => {
            const outsideDesktop = !notificationRef.current?.contains(event.target as Node);
            const outsideMobile = !mobileNotificationRef.current?.contains(event.target as Node);
            if (outsideDesktop && outsideMobile) {
                setIsNotificationOpen(false);
            }
        };

        if (isNotificationOpen) {
            document.addEventListener("mousedown", handleClickOutsideNotification);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideNotification);
        };
    }, [isNotificationOpen]);

    const fetchAdmins = async () => {
        setIsAdminsLoading(true);
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch {
            setAdmins([]);
        } finally {
            setIsAdminsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleNotificationToggle = () => {
        setIsNotificationOpen((prev) => {
            const next = !prev;
            if (next) fetchAdmins();
            return next;
        });
    };

    const handleApproveAdmin = async (adminId: number) => {
        setProcessingAdminId(adminId);
        try {
            await approveAdmin(adminId);
            setAlertType("success");
            setAlertMessage("가입 신청을 승인했습니다.");
            setAlertOpen(true);
            await fetchAdmins();
        } catch {
            setAlertType("error");
            setAlertMessage("승인 처리에 실패했습니다.");
            setAlertOpen(true);
        } finally {
            setProcessingAdminId(null);
        }
    };

    const handleRejectAdmin = async (adminId: number) => {
        setProcessingAdminId(adminId);
        try {
            await rejectAdmin(adminId);
            setAlertType("success");
            setAlertMessage("가입 신청을 거절했습니다.");
            setAlertOpen(true);
            await fetchAdmins();
        } catch {
            setAlertType("error");
            setAlertMessage("거절 처리에 실패했습니다.");
            setAlertOpen(true);
        } finally {
            setProcessingAdminId(null);
        }
    };

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = [];

        const matchingStudents = students.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 5);
        const matchingTeachers = teachers.filter((t) => t.name.toLowerCase().includes(query)).slice(0, 5);

        if (pathname === "/management/attendance/student") {
            matchingStudents.forEach((student) => {
                const currentYear = "2025";
                const classes2025 = student.classesByYear?.[currentYear];
                let breadcrumb = student.name;
                if (classes2025 && classes2025.length > 0) {
                    const c = classes2025[0];
                    breadcrumb = `${c.grade}학년 ${c.classNumber}반 > ${student.name}`;
                }
                results.push({ id: student.id, name: student.name, type: "student", description: "학생", destination: "management-attendance", breadcrumb });
            });
            return results.slice(0, 10);
        }

        matchingStudents.forEach((student) => {
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

            results.push({ id: student.id, name: student.name, type: "student", description, destination: "attendance", breadcrumb: `출석체크 > 학생 > ${student.name}` });
            results.push({ id: student.id, name: student.name, type: "student", description, destination: "management", breadcrumb: `사용자 관리 > 학생 > ${student.name}` });
        });

        matchingTeachers.forEach((teacher) => {
            results.push({ id: teacher.id, name: teacher.name, type: "teacher", description: "선생님", destination: "attendance", breadcrumb: `출석체크 > 선생님 > ${teacher.name}` });
            results.push({ id: teacher.id, name: teacher.name, type: "teacher", description: "선생님", destination: "management", breadcrumb: `관리 > 선생님 > ${teacher.name}` });
        });

        return results.slice(0, 10);
    }, [searchQuery, students, teachers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (pathname === "/management/attendance/student") {
            setHeaderSearch(e.target.value.trim() ? { query: e.target.value, type: "student" } : null);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        setSearchQuery("");
        setIsSearchFocused(false);

        const recentSearchItem = {
            id: result.id,
            name: result.name,
            description: result.description,
            type: result.type,
            status: "before" as const,
        };

        try {
            const existingData = localStorage.getItem("recentSearchItems");
            let recentSearches: typeof recentSearchItem[] = [];
            if (existingData) {
                try { recentSearches = JSON.parse(existingData); } catch { recentSearches = []; }
            }
            recentSearches = recentSearches.filter(
                (item) => !(item.id === recentSearchItem.id && item.type === recentSearchItem.type)
            );
            recentSearches.unshift(recentSearchItem);
            localStorage.setItem("recentSearchItems", JSON.stringify(recentSearches.slice(0, 5)));
            window.dispatchEvent(new Event("localStorageUpdate"));
        } catch {}

        setHeaderSearch({ query: result.name, type: result.type });

        if (result.destination === "attendance") {
            setSelectedItem(recentSearchItem);
            router.push("/attendance");
        } else if (result.destination === "management") {
            router.push(result.type === "teacher" ? "/management/people/teacher" : "/management/people/student");
        }
        // "management-attendance": 이미 해당 페이지에 있으므로 headerSearch만 설정
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

    const handleAiToggle = () => {
        if (isAiOpen) {
            setIsAiClosing(true);
            setIsAiOpen(false);
            setTimeout(() => setIsAiClosing(false), 300);
        } else {
            setIsAiOpen(true);
        }
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
                            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            : isSelected(day)
                            ? "bg-[#2C79FF] text-white font-bold"
                            : isToday(day)
                            ? "bg-gray-200 dark:bg-gray-700 font-semibold text-gray-900 dark:text-gray-100"
                            : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-[250px]">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                    </button>
                    <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                    </span>
                    <button
                        onClick={handleNextMonth}
                        disabled={isNextMonthFuture}
                        className={`p-1 rounded ${
                            isNextMonthFuture
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                        <ChevronRight className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdays.map((day) => (
                        <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400">
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

    const renderNotificationPanel = () => (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80 max-w-[calc(100vw-2.5rem)]">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-bold text-sm text-gray-900 dark:text-gray-100">
                알림
            </div>
            <div className="max-h-80 overflow-y-auto">
                {isAdminsLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</div>
                ) : pendingAdmins.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">승인 대기 중인 신청이 없습니다.</div>
                ) : (
                    pendingAdmins.map((admin) => (
                        <div key={admin.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex flex-col gap-0.5 mb-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {admin.name} <span className="text-gray-400 dark:text-gray-500 font-normal">({admin.username})</span>
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{admin.email} · {admin.phone}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleApproveAdmin(admin.id)}
                                    disabled={processingAdminId === admin.id}
                                    className="flex-1 rounded-md bg-[#2C79FF] text-white text-xs font-medium py-1.5 hover:bg-[#1B4FB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    승인
                                </button>
                                <button
                                    onClick={() => handleRejectAdmin(admin.id)}
                                    disabled={processingAdminId === admin.id}
                                    className="flex-1 rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    거절
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <>
            <header className="flex flex-col relative bg-white dark:bg-gray-900 z-50 border-b border-[#D9D9D9] dark:border-gray-800">
                <div className="flex flex-row items-center w-full px-5 py-3 relative">
                    {/* ===== lg 미만: 모바일 레이아웃 ===== */}
                    {/* 왼쪽: 로고 */}
                    <div className="lg:hidden flex items-center gap-2 shrink-0 min-w-0">
                        <Image src="/images/logo.png" alt="logo" width={60} height={28} className="shrink-0" priority />
                    </div>

                    {/* 오른쪽: AI 아이콘 + 달력 아이콘 + 메뉴 */}
                    <div className="lg:hidden flex items-center gap-0.5 shrink-0 ml-auto">
                        <ThemeToggle className="mr-1" />
                        <button
                            onClick={handleAiToggle}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="AI 채팅"
                        >
                            <Sparkles className="w-5 h-5 text-[#2C79FF]" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={handleNotificationToggle}
                                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="가입 승인 알림"
                            >
                                <Bell className="w-5 h-5 text-[#2C79FF]" />
                                {pendingAdmins.length > 0 && (
                                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                        {pendingAdmins.length}
                                    </span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <div ref={mobileNotificationRef} className="absolute top-10 right-0 z-[99999]">
                                    {renderNotificationPanel()}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="메뉴 열기"
                        >
                            <Menu className="w-6 h-6 text-[#2C79FF]" />
                        </button>
                    </div>

                    {/* lg 이상: 검색창 - 왼쪽 */}
                    <div className="hidden lg:flex flex-1 relative mr-4">
                        <div className="relative w-full max-w-lg">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                                placeholder="이름을 입력해주세요"
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none transition-all"
                            />
                            {isSearchFocused && searchResults.length > 0 && pathname !== "/management/attendance/student" && (
                                <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[999] overflow-hidden">
                                    {searchResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}-${result.destination}`}
                                            onMouseDown={() => handleResultClick(result)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#F7F8FF] dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 text-left"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${result.destination === "attendance" ? "bg-[#2C79FF]" : "bg-emerald-500"}`} />
                                            <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{result.breadcrumb}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* lg 이상: AI 버튼 + 알림 + 달력 - 오른쪽 */}
                    <div className="hidden lg:flex items-center gap-1 flex-shrink-0 z-50">
                        <ThemeToggle className="mr-1" />
                        <button
                            onClick={handleAiToggle}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="AI 채팅"
                        >
                            <Sparkles className="w-5 h-5 text-[#2C79FF]" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={handleNotificationToggle}
                                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="가입 승인 알림"
                            >
                                <Bell className="w-5 h-5 text-[#2C79FF]" />
                                {pendingAdmins.length > 0 && (
                                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                        {pendingAdmins.length}
                                    </span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <div ref={notificationRef} className="absolute top-12 right-0 z-[99999]">
                                    {renderNotificationPanel()}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative z-50"
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
                        {admin && (
                            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-gray-200 dark:border-gray-700">
                                <div className="w-9 h-9 rounded-full bg-[#EAF1FF] dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                    {admin.role.includes("SUPER") ? (
                                        <ShieldUser className="w-5 h-5 text-[#2C79FF]" />
                                    ) : (
                                        <User className="w-5 h-5 text-[#2C79FF]" />
                                    )}
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{admin.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{admin.username}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </header>

            <Chating isOpen={isAiOpen} isClosing={isAiClosing} onClose={handleAiToggle} />

            <Alert open={alertOpen} onOpenChange={setAlertOpen} type={alertType} message={alertMessage} />

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