"use client";

import { useEffect, useState, useMemo } from "react";
import { getStudentClassesByYear, type StudentClassItem, type StudentClassStudentItem } from "../../(shared)/(api)/student";
import { markParentAttendance } from "../../(shared)/(api)/attendance";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import Alert from "../../(shared)/(modal)/Alert";
import Search from "../../(shared)/(components)/Search";

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
    const { parentAttendances, getAttendances } = useAttendanceStore();
    const [baseStudents, setBaseStudents] = useState<Omit<StudentRow, "motherStatus" | "fatherStatus">[]>([]);
    const [overrides, setOverrides] = useState<Map<number, { motherStatus: ParentStatus; fatherStatus: ParentStatus }>>(new Map());
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<"success" | "error">("success");
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const classesData = await getStudentClassesByYear(2026);
                const allStudents: Omit<StudentRow, "motherStatus" | "fatherStatus">[] = [];
                classesData.forEach((classItem: StudentClassItem) => {
                    classItem.students?.forEach((student: StudentClassStudentItem) => {
                        allStudents.push({
                            studentId: student.studentId,
                            studentClassId: student.id,
                            name: student.studentName,
                        });
                    });
                });
                setBaseStudents(allStudents);
                await getAttendances(today);
            } catch (error) {
                console.error("학생 정보 조회 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [today]);

    const students: StudentRow[] = useMemo(() => {
        const attendanceMap = new Map(parentAttendances.map((a) => [a.studentId, a]));
        return baseStudents.map((s) => {
            const override = overrides.get(s.studentId);
            const record = attendanceMap.get(s.studentId);
            return {
                ...s,
                motherStatus: override?.motherStatus ?? (record?.motherStatus as ParentStatus) ?? null,
                fatherStatus: override?.fatherStatus ?? (record?.fatherStatus as ParentStatus) ?? null,
            };
        });
    }, [baseStudents, parentAttendances, overrides]);

    const handleAttend = async (studentId: number, parentType: ParentType) => {
        const field = parentType === "MOTHER" ? "motherStatus" : "fatherStatus";

        setOverrides((prev) => {
            const next = new Map(prev);
            const current = next.get(studentId) ?? { motherStatus: null, fatherStatus: null };
            next.set(studentId, { ...current, [field]: "ATTEND" });
            return next;
        });

        try {
            await markParentAttendance(studentId, today, parentType, "ATTEND");
            await getAttendances(today);
            setAlertType("success");
            setAlertMessage("출석 체크가 완료되었습니다.");
            setAlertOpen(true);
        } catch (error) {
            console.error("출석 체크 실패:", error);
            setOverrides((prev) => {
                const next = new Map(prev);
                const current = next.get(studentId) ?? { motherStatus: null, fatherStatus: null };
                next.set(studentId, { ...current, [field]: null });
                return next;
            });
            setAlertType("error");
            setAlertMessage("출석 체크 중 오류가 발생했습니다.");
            setAlertOpen(true);
        }
    };

    const filtered = students.filter((s) =>
        s.name.includes(search)
    );

    return (
        <div className="w-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">부모님 출석체크</h2>
                <Search
                    isOpen={isSearchOpen}
                    searchQuery={search}
                    onToggle={() => setIsSearchOpen(!isSearchOpen)}
                    onSearchChange={setSearch}
                />
            </div>
            {isLoading ? (
                <div className="py-8 text-center text-gray-500 text-sm">로딩 중...</div>
            ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">학생이 없습니다.</div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((student) => (
                        <div
                            key={student.studentId}
                            className="bg-[rgba(236,237,255,0.55)] backdrop-blur-[14px] border border-[rgba(180,180,255,0.35)] rounded-lg shadow-sm p-4"
                        >
                            <h3 className="font-semibold text-sm text-gray-800 mb-3 truncate">
                                {student.name}
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">어머니</span>
                                    <button
                                        onClick={() => handleAttend(student.studentId, "MOTHER")}
                                        disabled={student.motherStatus === "ATTEND"}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity ${
                                            student.motherStatus === "ATTEND"
                                                ? "bg-[#9EFC9B] text-[#00CB18] cursor-not-allowed"
                                                : "bg-[#d9d9d9] text-[#697077] hover:opacity-90"
                                        }`}
                                    >
                                        출석
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">아버지</span>
                                    <button
                                        onClick={() => handleAttend(student.studentId, "FATHER")}
                                        disabled={student.fatherStatus === "ATTEND"}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity ${
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
