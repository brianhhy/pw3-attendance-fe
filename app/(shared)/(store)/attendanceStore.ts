import { create } from "zustand";
import { getStudentAttendances, getTeacherAttendances, getParentAttendances } from "../(api)/attendance";
import type { AttendanceClassItem } from "../(api)/attendance";
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

interface TeacherClassInfo {
    schoolType: string;
    grade: number;
    classNumber: number;
}

interface TeacherItem {
    id: number;
    name: string;
    number: string;
    status: string;
    classesByYear?: {
        [year: string]: TeacherClassInfo[];
    };
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
    status: "attended" | "late" | "absent" | "ATTEND" | "LATE" | "ABSENT";
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

interface ParentAttendanceItem {
    studentId: number;
    studentName: string;
    date: number[];
    motherStatus: string | null;
    fatherStatus: string | null;
}

interface AttendanceStore {
    students: StudentItem[];
    teachers: TeacherItem[];
    getStudents: () => Promise<void>;
    getTeachers: () => Promise<void>;

    studentAttendances: StudentAttendance[];
    teacherAttendances: TeacherAttendance[];
    classAttendanceData: AttendanceClassItem[];
    parentAttendances: ParentAttendanceItem[];
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    getAttendances: (date?: string) => Promise<void>;
    
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
    students: [],
    teachers: [],
    
    studentAttendances: [],
    teacherAttendances: [],
    classAttendanceData: [],
    parentAttendances: [],
    selectedDate: getTodayDateString(),
    
    selectedItem: null,
    setSelectedItem: (item: RecentSearchItem | null) => {
        set({ selectedItem: item });
    },
    
    getStudents: async () => {
        try {
            const response = await getStudentsList();
            console.log("[attendanceStore] 학생 정보 응답:", response);
            set({ students: response || [] });
        } catch (error) {
            set({ students: [] });
        }
    },
    
    getTeachers: async () => {
        try {
            const response = await getTeacherList();
            set({ teachers: response || [] });
        } catch (error) {
            set({ teachers: [] });
        }
    },
    
    setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().getAttendances(date);
    },
    
    getAttendances: async (date?: string) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const schoolYear = new Date().getFullYear();

        try {
            const [classAttendanceData, teacherData, parentData] = await Promise.all([
                getStudentAttendances(schoolYear, targetDate),
                getTeacherAttendances(targetDate),
                getParentAttendances(targetDate),
            ]);

            console.log("[attendanceStore] 선생님 출석 정보 응답:", teacherData);

            set({
                classAttendanceData: classAttendanceData || [],
                teacherAttendances: teacherData || [],
                parentAttendances: parentData || [],
                selectedDate: targetDate,
            });
        } catch (error) {
            set({
                classAttendanceData: [],
                teacherAttendances: [],
                parentAttendances: [],
            });
        }
    },
}));

export default useAttendanceStore;

