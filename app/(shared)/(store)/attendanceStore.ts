import { create } from "zustand";
import { getStudentAttendances, getTeacherAttendances } from "../(api)/attendance";
import { getStudentsList } from "../(api)/student";
import { getTeacherList } from "../(api)/teacher";

interface ClassInfo {
    id: number;
    schoolType: string;
    grade: number;
    classNumber: number;
    name: string;
}

interface StudentItem {
    id: number;
    name: string;
    birth: string | null;
    sex: string | null;
    phone: string | null;
    parentPhone: string | null;
    school: string | null;
    memo: string | null;
    deletedAt: string | null;
    classesByYear: {
        [year: string]: ClassInfo[];
    };
}

interface TeacherItem {
    id: number;
    name: string;
    number: string;
    status: string;
}

interface StudentAttendance {
    id: number;
    studentId: number;
    date: string;
    status: "attended" | "late" | "absent";
    time?: string;
}

interface TeacherAttendance {
    id: number;
    teacherId: number;
    date: string;
    status: "attended" | "late" | "absent";
    time?: string;
}

interface RecentSearchItem {
    id: number;
    name: string;
    description: string;
    type: "student" | "teacher";
    status: "before" | "attended" | "late" | "absent";
    time?: string;
}

interface AttendanceStore {
    // 학생/선생님 정보
    students: StudentItem[];
    teachers: TeacherItem[];
    getStudents: () => Promise<void>;
    getTeachers: () => Promise<void>;
    
    // 출석 정보
    studentAttendances: StudentAttendance[];
    teacherAttendances: TeacherAttendance[];
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    getAttendances: (date?: string) => Promise<void>;
    
    // 선택된 아이템 (출석 체크용)
    selectedItem: RecentSearchItem | null;
    setSelectedItem: (item: RecentSearchItem | null) => void;
}

const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const useAttendanceStore = create<AttendanceStore>((set, get) => ({
    // 학생/선생님 정보 초기값
    students: [],
    teachers: [],
    
    // 출석 정보 초기값
    studentAttendances: [],
    teacherAttendances: [],
    selectedDate: getTodayDateString(),
    
    // 선택된 아이템 초기값
    selectedItem: null,
    setSelectedItem: (item: RecentSearchItem | null) => {
        set({ selectedItem: item });
    },
    
    // 학생 정보 가져오기
    getStudents: async () => {
        try {
            console.log("[attendanceStore] 학생 정보 가져오기 시작");
            const response = await getStudentsList();
            console.log("[attendanceStore] 학생 정보 응답:", response);
            set({ students: response || [] });
            console.log("[attendanceStore] 학생 정보 저장 완료, 학생 수:", (response || []).length);
        } catch (error) {
            console.error("[attendanceStore] 학생 정보를 가져오는 중 오류 발생:", error);
            set({ students: [] });
        }
    },
    
    // 선생님 정보 가져오기
    getTeachers: async () => {
        try {
            console.log("[attendanceStore] 선생님 정보 가져오기 시작");
            const response = await getTeacherList();
            console.log("[attendanceStore] 선생님 정보 응답:", response);
            set({ teachers: response || [] });
            console.log("[attendanceStore] 선생님 정보 저장 완료, 선생님 수:", (response || []).length);
        } catch (error) {
            console.error("[attendanceStore] 선생님 정보를 가져오는 중 오류 발생:", error);
            set({ teachers: [] });
        }
    },
    
    // 날짜 설정 및 출석 정보 가져오기
    setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().getAttendances(date);
    },
    
    // 출석 정보 가져오기
    getAttendances: async (date?: string) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const year = new Date(targetDate).getFullYear();

        try {
            console.log("[attendanceStore] 출석 정보 가져오기 시작, 날짜:", targetDate, "년도:", year);
            const [studentData, teacherData] = await Promise.all([
                getStudentAttendances(year, targetDate),
                getTeacherAttendances(targetDate),
            ]);

            console.log("[attendanceStore] 학생 출석 정보 응답:", studentData);
            console.log("[attendanceStore] 선생님 출석 정보 응답:", teacherData);

            set({
                studentAttendances: studentData || [],
                teacherAttendances: teacherData || [],
                selectedDate: targetDate,
            });

            console.log("[attendanceStore] 출석 정보 저장 완료");
            console.log("[attendanceStore] - 학생 출석 수:", (studentData || []).length);
            console.log("[attendanceStore] - 선생님 출석 수:", (teacherData || []).length);
        } catch (error) {
            console.error("[attendanceStore] 출석 정보를 가져오는 중 오류 발생:", error);
            set({
                studentAttendances: [],
                teacherAttendances: [],
            });
        }
    },
}));

export default useAttendanceStore;

