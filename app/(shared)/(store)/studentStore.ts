import { create } from "zustand";
import { getStudentsList } from "../(api)/student";

interface StudentItem {
    id: number;
    name: string;
    number: string;
    phone: string;
    schoolYear: number;
    classRoomId: number;
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