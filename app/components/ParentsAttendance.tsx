"use client";

import { useEffect, useState } from "react";
import { getStudentClassesByYear, type StudentClassItem, type StudentClassStudentItem } from "../(shared)/(api)/student";
import { markParentAttendance, getParentAttendances } from "../(shared)/(api)/attendance";
import Alert from "../(shared)/(modal)/Alert";

type ParentType = "MOTHER" | "FATHER";
type ParentStatus = "ATTEND" | "ABSENT" | null;

interface StudentRow {
    studentId: number;
    studentClassId: number;
    name: string;
    motherStatus: ParentStatus;
    fatherStatus: ParentStatus;
}

export default function ParentsAttendance() {
    const today = new Date().toISOString().slice(0, 10);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<"success" | "error">("success");
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const classesData = await getStudentClassesByYear(2026);

                const allStudents: StudentRow[] = [];
                classesData.forEach((classItem: StudentClassItem) => {
                    classItem.students?.forEach((student: StudentClassStudentItem) => {
                        allStudents.push({
                            studentId: student.studentId,
                            studentClassId: student.id,
                            name: student.studentName,
                            motherStatus: null,
                            fatherStatus: null,
                        });
                    });
                });

                // 기존 출석 정보 불러오기
                try {
                    const parentAttendances = await getParentAttendances(today);
                    const attendanceMap = new Map(parentAttendances.map((a) => [a.studentId, a]));
                    allStudents.forEach((student) => {
                        const record = attendanceMap.get(student.studentId);
                        if (record) {
                            student.motherStatus = (record.motherStatus as ParentStatus) ?? null;
                            student.fatherStatus = (record.fatherStatus as ParentStatus) ?? null;
                        }
                    });
                } catch {
                    // 출석 조회 실패해도 목록은 표시
                }

                setStudents(allStudents);
            } catch (error) {
                console.error("학생 정보 조회 실패:", error);
                setStudents([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [today]);

    const handleAttend = async (studentId: number, parentType: ParentType) => {
        const field = parentType === "MOTHER" ? "motherStatus" : "fatherStatus";

        setStudents((prev) =>
            prev.map((s) =>
                s.studentId === studentId ? { ...s, [field]: "ATTEND" } : s
            )
        );

        try {
            await markParentAttendance(studentId, today, parentType, "ATTEND");
            setAlertType("success");
            setAlertMessage("출석 체크가 완료되었습니다.");
            setAlertOpen(true);
        } catch (error) {
            console.error("출석 체크 실패:", error);
            setStudents((prev) =>
                prev.map((s) =>
                    s.studentId === studentId ? { ...s, [field]: null } : s
                )
            );
            setAlertType("error");
            setAlertMessage("출석 체크 중 오류가 발생했습니다.");
            setAlertOpen(true);
        }
    };

    return (
        <div className="w-full flex flex-col p-4">
            <h2 className="text-2xl font-semibold mb-6">부모님 출석체크</h2>
            {isLoading ? (
                <div className="py-8 text-center text-gray-500 text-sm">로딩 중...</div>
            ) : students.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">학생이 없습니다.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                        <div
                            key={student.studentId}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                        >
                            <h3 className="font-semibold text-base mb-3 text-gray-800">
                                {student.name}
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">어머니</span>
                                    <button
                                        onClick={() => handleAttend(student.studentId, "MOTHER")}
                                        disabled={student.motherStatus === "ATTEND"}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity ${
                                            student.motherStatus === "ATTEND"
                                                ? "bg-[#9EFC9B] text-[#00CB18] cursor-not-allowed"
                                                : "bg-[#d9d9d9] text-[#697077] hover:opacity-90"
                                        }`}
                                    >
                                        출석
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">아버지</span>
                                    <button
                                        onClick={() => handleAttend(student.studentId, "FATHER")}
                                        disabled={student.fatherStatus === "ATTEND"}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity ${
                                            student.fatherStatus === "ATTEND"
                                                ? "bg-[#9EFC9B] text-[#00CB18] cursor-not-allowed"
                                                : "bg-[#d9d9d9] text-[#697077] hover:opacity-90"
                                        }`}
                                    >
                                        출석
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Alert
                open={alertOpen}
                onOpenChange={setAlertOpen}
                type={alertType}
                message={alertMessage}
            />
        </div>
    );
}
