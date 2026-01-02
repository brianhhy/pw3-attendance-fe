import { create } from "zustand";
import { getStudentsList } from "../(api)/student";

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

interface StudentStore {
    students: StudentItem[];
    getStudents: () => Promise<void>;
}

const useStudentStore = create<StudentStore>((set) => ({
    students: [],
    getStudents: async () => {
        const response = await getStudentsList();
        set({ students: response });
    }
}));

export default useStudentStore;