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

    headerSearch: { query: string; type: "student" | "teacher" } | null;
    setHeaderSearch: (search: { query: string; type: "student" | "teacher" } | null) => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식의 문자열로 반환한다.
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
    headerSearch: null,

    setSelectedItem: (item: RecentSearchItem | null) => {
        set({ selectedItem: item });
    },

    setHeaderSearch: (search) => {
        set({ headerSearch: search });
    },

    // 전체 학생 목록을 API에서 불러와 store에 저장한다.
    getStudents: async () => {
        try {
            const response = await getStudentsList();
            set({ students: response || [] });
        } catch (error) {
            set({ students: [] });
        }
    },

    // 전체 선생님 목록을 API에서 불러와 store에 저장한다.
    getTeachers: async () => {
        try {
            const response = await getTeacherList();
            set({ teachers: response || [] });
        } catch (error) {
            set({ teachers: [] });
        }
    },

    // 선택된 날짜를 변경하고 해당 날짜의 출석 데이터를 갱신한다.
    setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().getAttendances(date);
    },

    // 지정된 날짜의 학생·선생님·학부모 출석 데이터를 한 번에 조회하여 store에 저장한다.
    getAttendances: async (date?: string) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const schoolYear = new Date().getFullYear();

        try {
            const [classAttendanceData, teacherData, parentData] = await Promise.all([
                getStudentAttendances(schoolYear, targetDate),
                getTeacherAttendances(targetDate),
                getParentAttendances(targetDate),
            ]);

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
