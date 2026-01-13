"use client";

import useAttendanceStore from "@/app/(shared)/(store)/attendanceStore";
import { useEffect, useState, useMemo } from "react";
import { User, Check, Clock, X, ArrowLeft, Search } from "lucide-react";
import { markStudentAttendance, markTeacherAttendance, getTeacherAttendances } from "@/app/(shared)/(api)/attendance";
import AttendanceLogModal from "@/app/(shared)/(modal)/AttendanceLogModal";

interface RecentSearchItem {
    id: number;
    name: string;
    description: string;
    type: "student" | "teacher";
    status: "before" | "attended" | "late" | "absent";
    time?: string;
}

export default function SelfAttendance() {
    const { 
        teachers, 
        students, 
        getTeachers, 
        getStudents,
        selectedItem,
        setSelectedItem,
        selectedDate,
        studentAttendances,
        teacherAttendances,
        classAttendanceData,
        getAttendances
    } = useAttendanceStore();
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [teacherAttendanceStatus, setTeacherAttendanceStatus] = useState<{ status?: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    useEffect(() => {
        getTeachers();
        getStudents();
        getAttendances();
    }, [getTeachers, getStudents, getAttendances]);

    useEffect(() => {
        if (selectedItem) {
            getAttendances();
            
            if (selectedItem.type === "teacher") {
                const fetchTeacherStatus = async () => {
                    try {
                        const allTeacherAttendances = await getTeacherAttendances(selectedDate);
                        const teacherAttendance = Array.isArray(allTeacherAttendances)
                            ? allTeacherAttendances.find((item: any) => {
                                const teacherId = item.teacherId || item.teacher_id || item.id;
                                return teacherId === selectedItem.id;
                            })
                            : null;
                        
                        if (teacherAttendance) {
                            setTeacherAttendanceStatus({
                                status: teacherAttendance.status || teacherAttendance.attendanceStatus || teacherAttendance.attendance_status
                            });
                        } else {
                            setTeacherAttendanceStatus(null);
                        }
                    } catch (error) {
                        setTeacherAttendanceStatus(null);
                    }
                };
                fetchTeacherStatus();
            } else {
                setTeacherAttendanceStatus(null);
            }
        } else {
            setTeacherAttendanceStatus(null);
        }
    }, [selectedDate, selectedItem, getAttendances]);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? "오후" : "오전";
            const displayHours = hours % 12 || 12;
            setCurrentTime(`${ampm} ${displayHours}시 ${minutes}분`);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem("recentSearchItems");
            if (storedData) {
                const parsedData: RecentSearchItem[] = JSON.parse(storedData);
                setRecentSearches(parsedData);
            } else {
                setRecentSearches([]);
            }
        } catch (error) {
            setRecentSearches([]);
        }
    }, []);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "recentSearchItems") {
                try {
                    if (e.newValue) {
                        const parsedData: RecentSearchItem[] = JSON.parse(e.newValue);
                        setRecentSearches(parsedData);
                    }
                } catch (error) {
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        
        const handleCustomStorageChange = () => {
            try {
                const storedData = localStorage.getItem("recentSearchItems");
                if (storedData) {
                    const parsedData: RecentSearchItem[] = JSON.parse(storedData);
                    setRecentSearches(parsedData);
                }
            } catch (error) {
            }
        };

        window.addEventListener("localStorageUpdate", handleCustomStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("localStorageUpdate", handleCustomStorageChange);
        };
    }, []);

    const handleAttendanceCheck = async () => {
        if (!selectedItem) return;

        try {
            if (selectedItem.type === "student") {
                let studentClassId: number | null = null;
                
                for (const classData of classAttendanceData) {
                    if (!classData.students || !Array.isArray(classData.students)) continue;
                    
                    const student = classData.students.find((s: any) => 
                        s.studentName === selectedItem.name
                    );
                    
                    if (student) {
                        studentClassId = student.studentClassId; // 받아온 데이터의 studentClassId 값
                        break;
                    }
                }
                
                if (!studentClassId) {
                    alert("학생 반 정보를 찾을 수 없습니다.");
                    return;
                }

                const currentHour = new Date().getHours();
                const currentMinute = new Date().getMinutes();
                const attendanceStatus = currentHour < 9 || (currentHour === 9 && currentMinute === 0) ? "ATTEND" : "LATE";

                await markStudentAttendance(studentClassId, selectedDate, attendanceStatus);
                await getAttendances();
                setIsLogModalOpen(true);
            } else if (selectedItem.type === "teacher") {
                const teacher = teachers.find((t) => 
                    t.id === selectedItem.id || 
                    Number(t.id) === Number(selectedItem.id) ||
                    String(t.id) === String(selectedItem.id)
                );
                
                if (!teacher) {
                    alert("선생님 정보를 찾을 수 없습니다.");
                    return;
                }

                const currentHour = new Date().getHours();
                const currentMinute = new Date().getMinutes();
                const attendanceStatus = currentHour < 9 || (currentHour === 9 && currentMinute === 0) ? "ATTEND" : "LATE";

                await markTeacherAttendance(teacher.id, attendanceStatus, selectedDate);
                await getAttendances();
                const allTeacherAttendances = await getTeacherAttendances(selectedDate);
                const teacherAttendance = Array.isArray(allTeacherAttendances)
                    ? allTeacherAttendances.find((item: any) => {
                        const teacherId = item.teacherId || item.teacher_id || item.id;
                        return teacherId === teacher.id;
                    })
                    : null;
                
                if (teacherAttendance) {
                    setTeacherAttendanceStatus({
                        status: teacherAttendance.status || teacherAttendance.attendanceStatus || teacherAttendance.attendance_status
                    });
                } else {
                    setTeacherAttendanceStatus(null);
                }
                setIsLogModalOpen(true);
            }
        } catch (error: any) {
            let errorMessage = "출석 체크 중 오류가 발생했습니다.";
            if (error.response?.status === 400) {
                const serverMessage = error.response?.data?.message || error.response?.data?.error || "잘못된 요청입니다.";
                errorMessage = `잘못된 요청입니다: ${serverMessage}`;
            } else if (error.response?.status === 500) {
                errorMessage = "서버 오류가 발생했습니다. 날짜가 올바른지 확인해주세요. (미래 날짜는 사용할 수 없습니다)";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        }
    };

    const isAttendanceCompleted = useMemo(() => {
        if (!selectedItem) return false;
        
        if (selectedItem.type === "student") {
            for (const classData of classAttendanceData) {
                if (!classData.students || !Array.isArray(classData.students)) continue;
                
                const student = classData.students.find((s: any) => 
                    s.studentName === selectedItem.name
                );
                
                if (student && student.status) {
                    const statusStr = String(student.status);
                    const statusUpper = statusStr.toUpperCase();
                    const isAttend = statusUpper === "ATTEND" || statusUpper === "ATTENDED" || statusStr === "ATTEND";
                    return isAttend;
                }
            }
            return false;
        } else {
            if (!teacherAttendanceStatus || !teacherAttendanceStatus.status) {
                return false;
            }
            
            const statusStr = String(teacherAttendanceStatus.status);
            const statusUpper = statusStr.toUpperCase();
            const isAttend = statusUpper === "ATTEND" || statusUpper === "ATTENDED" || statusStr === "ATTEND";
            
            return isAttend;
        }
    }, [selectedItem, selectedDate, studentAttendances, teacherAttendances, students, teacherAttendanceStatus, classAttendanceData]);


    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        const query = searchQuery.toLowerCase();
        const results: RecentSearchItem[] = [];
        
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
                    description: description,
                    status: "before"
                });
            }
        });
        
        teachers.forEach((teacher) => {
            if (teacher.name.toLowerCase().includes(query)) {
                results.push({ 
                    id: teacher.id,
                    name: teacher.name, 
                    type: "teacher",
                    description: "선생님",
                    status: "before"
                });
            }
        });
        
        return results.slice(0, 10);
    }, [searchQuery, students, teachers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchResultClick = (result: RecentSearchItem) => {
        setSearchQuery("");
        setIsSearchFocused(false);
        
        try {
            const existingData = localStorage.getItem("recentSearchItems");
            let recentSearches: RecentSearchItem[] = [];
            
            if (existingData) {
                try {
                    recentSearches = JSON.parse(existingData);
                } catch (e) {
                    recentSearches = [];
                }
            }
            
            recentSearches = recentSearches.filter(
                (item) => !(item.id === result.id && item.type === result.type)
            );

            recentSearches.unshift(result);
            
            recentSearches = recentSearches.slice(0, 5);
            
            localStorage.setItem("recentSearchItems", JSON.stringify(recentSearches));
            
            window.dispatchEvent(new Event("localStorageUpdate"));
            
            setSelectedItem(result);
        } catch (error) {
        }
    };

    const getStatusComponent = (item: RecentSearchItem) => {
        switch (item.status) {
            case "before":
                return <span className="text-[#697077]">출석 전</span>;
            case "attended":
                return (
                    <div className="flex items-center gap-2 bg-[#9EFC9B] px-3 py-1 rounded-md">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#00CB18]" />
                        </div>
                        <span className="text-[#00CB18]">{item.time}</span>
                    </div>
                );
            case "late":
                return (
                    <div className="flex items-center gap-2 bg-[#FCD39B] px-3 py-1 rounded-md">
                        <Clock className="w-4 h-4 text-[#F39200]" />
                        <span className="text-[#F39200]">{item.time}</span>
                    </div>
                );
            case "absent":
                return (
                    <div className="bg-red-100 px-3 py-1 rounded-md">
                        <span className="text-red-500">결석</span>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col justify-center items-center text-center gap-4">
            {/* 검색창 및 최근 검색어 섹션 - selectedItem이 null일 때만 표시 */}
            {!selectedItem && (
                <div className="w-full max-w-[500px] flex flex-col gap-4 mb-40">
                    {/* 검색창과 최근 검색어 제목을 같은 행에 배치 */}
                    <div className="flex flex-row items-center justify-between gap-4">
                        {/* 최근 검색어 제목 - 왼쪽 */}
                        {recentSearches.length > 0 && (
                            <h3 className="text-left text-[#2C79FF] font-medium text-3xl flex-shrink-0">최근 검색어</h3>
                        )}
                        
                        {/* 검색창 - 1024px 이하에서만 표시, 오른쪽 */}
                        <div className="relative flex flex-col min-[1025px]:hidden flex-shrink-0 ml-auto">
                            <div className={`relative flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
                                isSearchFocused || searchQuery ? "w-[189px]" : "w-10"
                            }`}>
                                <button
                                    onClick={() => setIsSearchFocused(true)}
                                    className="absolute left-0 z-10 flex items-center justify-center w-8 h-8 text-[#2C79FF] hover:text-[#2C79FF] transition-colors"
                                    aria-label="검색"
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                                <input 
                                    type="text" 
                                    placeholder="학생명, 선생님 이름 입력" 
                                    className={`w-full h-[30px] pl-8 pr-1 bg-[#F7F8FF] border-none text-sm focus:outline-none transition-all duration-300 ${
                                        isSearchFocused || searchQuery ? "opacity-100" : "opacity-0 pointer-events-none"
                                    }`}
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                />
                            </div>
                            
                            {/* 검색 결과 드롭다운 */}
                            {isSearchFocused && searchResults.length > 0 && (
                                <div className="absolute top-[42px] left-0 w-full bg-gray-50 border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto mt-1">
                                    {searchResults.map((result) => (
                                        <div
                                            key={`${result.type}-${result.id}`}
                                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                                            onClick={() => handleSearchResultClick(result)}
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
                    </div>
                    
                    {/* 최근 검색어 리스트 */}
                    {recentSearches.length > 0 && (
                        <div className="flex flex-col gap-2 bg-transparent">
                        {recentSearches.map((item, index) => (
                            <div
                                key={`${item.type}-${item.id}-${index}`}
                                onClick={() => setSelectedItem(item)}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                {/* 프로필 아이콘 */}
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-gray-500" />
                                </div>
                                
                                {/* 이름과 설명 */}
                                <div className="flex-1 flex flex-col items-start">
                                    <span className="font-bold text-black">{item.name}</span>
                                    <span className="text-sm text-gray-500">{item.description}</span>
                                </div>
                                
                                {/* 상태 표시 */}
                                <div className="flex-shrink-0 ml-20">
                                    {getStatusComponent(item)}
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            )}

            {/* 기존 출석 체크 컴포넌트 - selectedItem이 있을 때만 표시 */}
            {selectedItem && (() => {
                const isCompleted = isAttendanceCompleted;
                
                return (
                    <div className="flex flex-col max-w-[500px] max-h-[700px] p-6 gap-6 rounded-[15px] border-[1px] border-[#D7E2ED] bg-[#ffffff]">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="self-start flex items-center gap-1 text-[#697077] hover:text-[#2C79FF] transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">뒤로가기</span>
                        </button>
                        <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-[40px] font-bold text-black">
                                {selectedItem.name}
                            </span>
                            <span className="text-[30px] font-medium text-[#697077]">
                                {selectedItem.description}
                            </span>
                        </div>
                        <div className="flex items-center justify-center">
                            {isCompleted ? (
                                <div className="w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#11998E] to-[#38EF7D] p-[2px] flex-shrink-0 aspect-square">
                                    <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center gap-4">
                                        <span className="text-[48px] font-bold bg-gradient-to-br from-[#11998E] to-[#38EF7D] bg-clip-text text-transparent">
                                            {currentTime}
                                        </span>
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#11998E] to-[#38EF7D] flex items-center justify-center">
                                            <Check className="w-7 h-7 text-white" />
                                        </div>
                                        <span className="text-[32px] font-medium bg-gradient-to-br from-[#11998E] to-[#38EF7D] bg-clip-text text-transparent">
                                            출석 완료
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-[400px] h-[400px] bg-white rounded-full border-[1px] border-[#D7E2ED] flex flex-col items-center justify-center gap-4 flex-shrink-0 aspect-square">
                                    <span className="text-[48px] font-bold text-[#697077]">
                                        {currentTime}
                                    </span>
                                    <span className="text-[32px] font-medium text-[#697077]">
                                        출석 전
                                    </span>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleAttendanceCheck}
                            disabled={isCompleted}
                            className={`w-[400px] h-[60px] ${isCompleted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-[#0AB81E] hover:opacity-90'} font-medium text-[30px] rounded-[10px] transition-opacity`}
                        >
                            {isCompleted ? "출석 완료" : "출석 체크하기"}
                        </button>
                    </div>
                );
            })()}

            <AttendanceLogModal
                open={isLogModalOpen}
                onOpenChange={setIsLogModalOpen}
                selectedDate={selectedDate}
                classAttendanceData={classAttendanceData}
                teacherAttendances={teacherAttendances}
            />
        </div>
    );
}