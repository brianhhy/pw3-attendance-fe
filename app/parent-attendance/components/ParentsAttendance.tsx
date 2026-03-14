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
    classRoomId: number;
    className: string;
    motherStatus: ParentStatus;
    fatherStatus: ParentStatus;
}

interface ClassGroup {
    classRoomId: number;
    className: string;
    students: StudentRow[];
}

export default function ParentsAttendance() {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
                const schoolTypePriority = (t: string) =>
                    t === "ELEMENTARY" ? 0 : t === "MIDDLE" ? 1 : t === "HIGH" ? 2 : 3;
                const classesData = (await getStudentClassesByYear(2026)).sort((a, b) => {
                    const typeDiff = schoolTypePriority(a.schoolType) - schoolTypePriority(b.schoolType);
                    if (typeDiff !== 0) return typeDiff;
                    const gradeDiff = a.grade - b.grade;
                    if (gradeDiff !== 0) return gradeDiff;
                    return a.classNumber - b.classNumber;
                });
                const allStudents: Omit<StudentRow, "motherStatus" | "fatherStatus">[] = [];
                classesData.forEach((classItem: StudentClassItem) => {
                    const schoolTypeLabel =
                        classItem.schoolType === "MIDDLE" ? "중학교" :
                        classItem.schoolType === "HIGH" ? "고등학교" :
                        classItem.schoolType === "ELEMENTARY" ? "초등학교" :
                        classItem.schoolType;
                    const className = classItem.className ?? `${schoolTypeLabel} ${classItem.grade}학년 ${classItem.classNumber}반`;
                    classItem.students?.forEach((student: StudentClassStudentItem) => {
                        allStudents.push({
                            studentId: student.studentId,
                            studentClassId: student.id,
                            name: student.studentName,
                            classRoomId: classItem.classRoomId,
                            className,
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

    const classGroups: ClassGroup[] = useMemo(() => {
        const attendanceMap = new Map(parentAttendances.map((a) => [a.studentId, a]));
        const groupMap = new Map<number, ClassGroup>();
        baseStudents.forEach((s) => {
            const override = overrides.get(s.studentId);
            const record = attendanceMap.get(s.studentId);
            const student: StudentRow = {
                ...s,
                motherStatus: override?.motherStatus ?? (record?.motherStatus as ParentStatus) ?? null,
                fatherStatus: override?.fatherStatus ?? (record?.fatherStatus as ParentStatus) ?? null,
            };
            if (!groupMap.has(s.classRoomId)) {
                groupMap.set(s.classRoomId, { classRoomId: s.classRoomId, className: s.className, students: [] });
            }
            groupMap.get(s.classRoomId)!.students.push(student);
        });
        return Array.from(groupMap.values());
    }, [baseStudents, parentAttendances, overrides]);

    const filteredGroups: ClassGroup[] = useMemo(() => {
        if (!search) return classGroups;
        return classGroups
            .map((g) => ({ ...g, students: g.students.filter((s) => s.name.includes(search)) }))
            .filter((g) => g.students.length > 0);
    }, [classGroups, search]);

    const handleAttend = async (studentId: number, parentType: ParentType, currentStatus: ParentStatus) => {
        const field = parentType === "MOTHER" ? "motherStatus" : "fatherStatus";
        const newStatus = currentStatus === "ATTEND" ? "ABSENT" : "ATTEND";

        setOverrides((prev) => {
            const next = new Map(prev);
            const current = next.get(studentId) ?? { motherStatus: null, fatherStatus: null };
            next.set(studentId, { ...current, [field]: newStatus });
            return next;
        });

        try {
            await markParentAttendance(studentId, today, parentType, newStatus);
            await getAttendances(today);
            setAlertType("success");
            setAlertMessage(newStatus === "ATTEND" ? "출석 체크가 완료되었습니다." : "출석이 취소되었습니다.");
            setAlertOpen(true);
        } catch (error) {
            console.error("출석 처리 실패:", error);
            setOverrides((prev) => {
                const next = new Map(prev);
                const current = next.get(studentId) ?? { motherStatus: null, fatherStatus: null };
                next.set(studentId, { ...current, [field]: currentStatus });
                return next;
            });
            setAlertType("error");
            setAlertMessage("처리 중 오류가 발생했습니다.");
            setAlertOpen(true);
        }
    };

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
            ) : filteredGroups.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">학생이 없습니다.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                        <div key={group.classRoomId} className="flex flex-col gap-3 bg-[rgba(245,247,255,0.6)] backdrop-blur-[16px] border border-[rgba(200,210,255,0.4)] rounded-xl p-4">
                            <h3 className="text-base font-semibold text-gray-700">{group.className}</h3>
                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                                {group.students.map((student) => (
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
                                                    onClick={() => handleAttend(student.studentId, "MOTHER", student.motherStatus)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ${
                                                        student.motherStatus === "ATTEND"
                                                            ? "bg-[#9EFC9B] text-[#00CB18]"
                                                            : "bg-[#d9d9d9] text-[#697077]"
                                                    }`}
                                                >
                                                    출석
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">아버지</span>
                                                <button
                                                    onClick={() => handleAttend(student.studentId, "FATHER", student.fatherStatus)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ${
                                                        student.fatherStatus === "ATTEND"
                                                            ? "bg-[#9EFC9B] text-[#00CB18]"
                                                            : "bg-[#d9d9d9] text-[#697077]"
                                                    }`}
                                                >
                                                    출석
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
