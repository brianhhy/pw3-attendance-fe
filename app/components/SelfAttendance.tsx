"use client";

import useAttendanceStore from "@/app/(shared)/(store)/attendanceStore";
import { useEffect, useState } from "react";
import { User, Check, Clock, X, ArrowLeft } from "lucide-react";
import { markStudentAttendance, markTeacherAttendance } from "@/app/(shared)/(api)/attendance";

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
        selectedDate
    } = useAttendanceStore();
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    const [currentTime, setCurrentTime] = useState<string>("");

    useEffect(() => {
        getTeachers();
        getStudents();
    }, [getTeachers, getStudents]);

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
        // localStorage에서 최근 검색어 가져오기
        try {
            const storedData = localStorage.getItem("recentSearchItems");
            if (storedData) {
                const parsedData: RecentSearchItem[] = JSON.parse(storedData);
                setRecentSearches(parsedData);
                console.log("[SelfAttendance] localStorage에서 최근 검색어 로드:", parsedData);
            } else {
                setRecentSearches([]);
            }
        } catch (error) {
            console.error("[SelfAttendance] localStorage 데이터 읽기 오류:", error);
            setRecentSearches([]);
        }
    }, []);

    // localStorage 변경 감지 (다른 탭이나 컴포넌트에서 변경 시 반영)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "recentSearchItems") {
                try {
                    if (e.newValue) {
                        const parsedData: RecentSearchItem[] = JSON.parse(e.newValue);
                        setRecentSearches(parsedData);
                        console.log("[SelfAttendance] localStorage 변경 감지, 최근 검색어 업데이트:", parsedData);
                    }
                } catch (error) {
                    console.error("[SelfAttendance] localStorage 변경 데이터 파싱 오류:", error);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        
        // 같은 탭에서의 변경도 감지하기 위한 커스텀 이벤트 리스너
        const handleCustomStorageChange = () => {
            try {
                const storedData = localStorage.getItem("recentSearchItems");
                if (storedData) {
                    const parsedData: RecentSearchItem[] = JSON.parse(storedData);
                    setRecentSearches(parsedData);
                }
            } catch (error) {
                console.error("[SelfAttendance] localStorage 데이터 읽기 오류:", error);
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
                // 학생인 경우
                const student = students.find((s) => s.id === selectedItem.id);
                if (!student) {
                    console.error("[SelfAttendance] 학생을 찾을 수 없습니다:", selectedItem.id);
                    alert("학생 정보를 찾을 수 없습니다.");
                    return;
                }

                // classesByYear.2026의 첫 번째 항목의 id를 studentClassId로 사용
                const classes2026 = student.classesByYear?.["2026"];
                if (!classes2026 || classes2026.length === 0) {
                    console.error("[SelfAttendance] 2026년 클래스 정보를 찾을 수 없습니다:", student);
                    alert("2026년 클래스 정보를 찾을 수 없습니다.");
                    return;
                }

                const studentClassId = classes2026[0].id;

                console.log("[SelfAttendance] 학생 출석 체크 시작:", {
                    studentId: student.id,
                    studentClassId: studentClassId,
                    date: selectedDate,
                    student: student,
                    classes2026: classes2026
                });

                // studentClassId를 사용하여 출석 체크
                const response = await markStudentAttendance(studentClassId, selectedDate);
                console.log("[SelfAttendance] 학생 출석 체크 응답:", response);
                alert("출석 체크가 완료되었습니다.");
            } else if (selectedItem.type === "teacher") {
                // 선생님인 경우
                const teacher = teachers.find((t) => t.id === selectedItem.id);
                if (!teacher) {
                    console.error("[SelfAttendance] 선생님을 찾을 수 없습니다:", selectedItem.id);
                    alert("선생님 정보를 찾을 수 없습니다.");
                    return;
                }

                // 선생님 출석 상태는 기본적으로 "attended"로 설정 (또는 현재 시간에 따라 "late"로 설정 가능)
                const currentHour = new Date().getHours();
                const currentMinute = new Date().getMinutes();
                const attendanceStatus = currentHour > 9 || (currentHour === 9 && currentMinute > 0) ? "late" : "attended";

                console.log("[SelfAttendance] 선생님 출석 체크 시작:", {
                    teacherId: teacher.id,
                    status: attendanceStatus,
                    date: selectedDate,
                    teacher: teacher,
                    currentTime: `${currentHour}:${currentMinute}`
                });

                const response = await markTeacherAttendance(teacher.id, attendanceStatus, selectedDate);
                console.log("[SelfAttendance] 선생님 출석 체크 응답:", response);
                alert("출석 체크가 완료되었습니다.");
            }
        } catch (error: any) {
            console.error("[SelfAttendance] 출석 체크 중 오류 발생:", error);
            console.error("[SelfAttendance] 에러 상세:", {
                message: error.message,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                requestUrl: error.config?.url,
                requestMethod: error.config?.method,
                requestData: error.config?.data
            });
            
            // 에러 응답의 상세 메시지 출력
            if (error.response?.data) {
                console.error("[SelfAttendance] 서버 응답 데이터:", JSON.stringify(error.response.data, null, 2));
            }
            
            // 에러 상태 코드에 따른 메시지
            let errorMessage = "출석 체크 중 오류가 발생했습니다.";
            if (error.response?.status === 400) {
                errorMessage = "잘못된 요청입니다. 날짜와 학생 정보를 확인해주세요.";
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
            {/* 최근 검색어 섹션 - selectedItem이 null일 때만 표시 */}
            {!selectedItem && recentSearches.length > 0 && (
                <div className="w-full max-w-[500px] flex flex-col gap-4 mb-40">
                    <h3 className="text-left text-[#2C79FF] font-medium text-3xl">최근 검색어</h3>
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
                </div>
            )}

            {/* 기존 출석 체크 컴포넌트 - selectedItem이 있을 때만 표시 */}
            {selectedItem && (
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
                        <div className="w-[400px] h-[400px] bg-transparent rounded-full border-[1px] border-[#D7E2ED] flex flex-col items-center justify-center gap-4 flex-shrink-0 aspect-square">
                            <span className="text-[48px] font-bold text-[#697077]">
                                {currentTime}
                            </span>
                            <span className="text-[32px] font-medium text-[#697077]">
                                출석 전
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleAttendanceCheck}
                        className="w-[400px] h-[60px] bg-linear-to-r from-[#A8FF78] to-[#78FFD6] text-[#0AB81E] font-bold text-[30px] rounded-[10px] hover:opacity-90 transition-opacity"
                    >
                        출석 체크하기
                    </button>
                </div>
            )}
        </div>
    );
}