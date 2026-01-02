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

interface ClassAttendanceData {
    classRoomId: number;
    className: string;
    teacherName: string;
    students: {
        studentClassId: number;
        studentName: string;
        status: "ATTEND" | "LATE" | "ABSENT" | null;
    }[];
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

interface AttendanceStore {
    // 학생/선생님 정보
    students: StudentItem[];
    teachers: TeacherItem[];
    getStudents: () => Promise<void>;
    getTeachers: () => Promise<void>;
    
    // 출석 정보
    studentAttendances: StudentAttendance[];
    teacherAttendances: TeacherAttendance[];
    classAttendanceData: ClassAttendanceData[]; // 반별 출석 정보 (studentClassId 포함)
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
    classAttendanceData: [],
    selectedDate: getTodayDateString(),
    
    // 선택된 아이템 초기값
    selectedItem: null,
    setSelectedItem: (item: RecentSearchItem | null) => {
        set({ selectedItem: item });
    },
    
    // 학생 정보 가져오기
    getStudents: async () => {
        try {
            const response = await getStudentsList();
            console.log("[attendanceStore] 학생 정보 응답:", response);
            set({ students: response || [] });
        } catch (error) {
            set({ students: [] });
        }
    },
    
    // 선생님 정보 가져오기
    getTeachers: async () => {
        try {
            const response = await getTeacherList();
            set({ teachers: response || [] });
        } catch (error) {
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
        const schoolYear = new Date().getFullYear(); // 올해 연도

        try {
            const [classAttendanceData, teacherData] = await Promise.all([
                getStudentAttendances(schoolYear, targetDate),
                getTeacherAttendances(targetDate),
            ]);

            console.log("[attendanceStore] 선생님 출석 정보 응답:", teacherData);

            set({
                classAttendanceData: classAttendanceData || [],
                teacherAttendances: teacherData || [],
                selectedDate: targetDate,
            });
        } catch (error) {
            set({
                classAttendanceData: [],
                teacherAttendances: [],
            });
        }
    },
}));

export default useAttendanceStore;

