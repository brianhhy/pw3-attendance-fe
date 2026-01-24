"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Settings, BarChart, Mail, Users, Share, X, LucideIcon } from "lucide-react";
import useAttendanceStore from "../(store)/attendanceStore";
import { exportAttendanceSummary } from "../(api)/attendance";
import Alert from "../(modal)/Alert";

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const menuItems: MenuItem[] = [
    { href: "/", label: "출석 체크", icon: ClipboardCheck },
    { href: "/management", label: "관리", icon: Settings },
    { href: "/matching", label: "반 매칭", icon: Users },
    { href: "/statistics", label: "통계", icon: BarChart },
    { href: "/message", label: "메시지", icon: Mail },
];

interface SidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
    const pathname = usePathname();
    const { selectedDate } = useAttendanceStore();
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<"success" | "error">("success");
    const [alertMessage, setAlertMessage] = useState("");

    const handleExportAttendance = async () => {
        try {
            const schoolYear = new Date(selectedDate).getFullYear();
            const data = await exportAttendanceSummary(selectedDate, schoolYear);
            
            // 데이터를 텍스트 형식으로 변환
            let textContent = `출석부 - ${selectedDate}\n\n`;
            
            // classAttendances 배열 처리
            if (data && typeof data === 'object' && Array.isArray(data.classAttendances)) {
                data.classAttendances.forEach((item: any) => {
                    // status가 null이 아닌 학생만 필터링
                    if (item.students && Array.isArray(item.students)) {
                        const filteredStudents = item.students.filter((student: any) => {
                            const status = student.status;
                            return status !== null && status !== undefined && status !== "";
                        });
                        
                        // 필터링된 학생이 있는 경우에만 반 정보 추가
                        if (filteredStudents.length > 0) {
                            if (item.classRoomName) {
                                textContent += `반: ${item.classRoomName}\n`;
                            }
                            if (item.teacherName) {
                                textContent += `담임: ${item.teacherName}\n`;
                            }
                            textContent += "학생 목록:\n";
                            filteredStudents.forEach((student: any, idx: number) => {
                                const status = student.status === "ATTEND" ? "출석" 
                                             : student.status === "LATE" ? "지각"
                                             : student.status === "ABSENT" ? "결석"
                                             : student.status === "OTHER" ? "기타"
                                             : "미체크";
                                textContent += `  ${idx + 1}. ${student.studentName || student.name} - ${status}\n`;
                            });
                            textContent += "\n";
                        }
                    }
                });

                // teacherAttendances 배열 처리 (status가 null이 아닌 선생님만)
                if (data.teacherAttendances && Array.isArray(data.teacherAttendances)) {
                    const filteredTeachers = data.teacherAttendances.filter((teacher: any) => {
                        const status = teacher.status;
                        return status !== null && status !== undefined && status !== "";
                    });

                    if (filteredTeachers.length > 0) {
                        textContent += "선생님 출석:\n";
                        filteredTeachers.forEach((teacher: any, idx: number) => {
                            const status = teacher.status === "ATTEND" ? "출석" 
                                         : teacher.status === "LATE" ? "지각"
                                         : teacher.status === "ABSENT" ? "결석"
                                         : teacher.status === "OTHER" ? "기타"
                                         : "미체크";
                            textContent += `  ${idx + 1}. ${teacher.teacherName || teacher.name} - ${status}\n`;
                        });
                    }
                }
            } else if (Array.isArray(data)) {
                // 배열 형태의 데이터 처리 (기존 로직 유지)
                data.forEach((item: any, index: number) => {
                    if (item.students && Array.isArray(item.students)) {
                        const filteredStudents = item.students.filter((student: any) => {
                            const status = student.status;
                            return status !== null && status !== undefined && status !== "";
                        });
                        
                        if (filteredStudents.length > 0) {
                            if (item.className || item.classRoomName) {
                                textContent += `반: ${item.className || item.classRoomName}\n`;
                            }
                            if (item.teacherName) {
                                textContent += `담임: ${item.teacherName}\n`;
                            }
                            textContent += "학생 목록:\n";
                            filteredStudents.forEach((student: any, idx: number) => {
                                const status = student.status === "ATTEND" ? "출석" 
                                             : student.status === "LATE" ? "지각"
                                             : student.status === "ABSENT" ? "결석"
                                             : student.status === "OTHER" ? "기타"
                                             : "미체크";
                                textContent += `  ${idx + 1}. ${student.studentName || student.name} - ${status}\n`;
                            });
                            textContent += "\n";
                        }
                    }
                });
            } else {
                textContent += "출석 데이터를 찾을 수 없습니다.";
            }
            
            // 클립보드에 복사
            await navigator.clipboard.writeText(textContent);
            setAlertType("success");
            setAlertMessage("출석부가 클립보드에 복사되었습니다.");
            setAlertOpen(true);
        } catch (error: any) {
            console.error("출석부 내보내기 실패:", error);
            setAlertType("error");
            let errorMessage = "출석부 내보내기에 실패했습니다.";
            if (error.response?.data) {
                const errorData = error.response.data;
                errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }
            setAlertMessage(errorMessage);
            setAlertOpen(true);
        }
    };

    return (
        <aside className={`flex flex-col flex-shrink-0 h-screen gap-[12px] bg-white ${
            isMobile ? "w-full" : "hidden lg:flex min-w-[100px] pt-[12px]"
        }`}>
            {/* 모바일 헤더 - 로고, 문구, X 버튼 */}
            {isMobile && (
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <Image src="/images/logo.png" alt="logo" width={150} height={40} />
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
                <button 
                    onClick={handleExportAttendance}
                    className="w-full px-[15px] py-[10px] rounded-[5px] bg-[#B3CFFF] text-white text-[25px] font-medium hover:bg-[#2C79FF] transition-colors flex flex-row items-center justify-center gap-[8px] cursor-pointer"
                >
                    <Share className="w-[25px] h-[25px]" />
                    <p>출석부 내보내기</p>
                </button>
            </div>

            <Alert
                open={alertOpen}
                onOpenChange={setAlertOpen}
                type={alertType}
                message={alertMessage}
            />
        </aside>
    )
}

export default Sidebar;