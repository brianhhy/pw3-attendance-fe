import { create } from "zustand";
import { getTeacherList } from "../(api)/teacher";

interface TeacherItem {
    id: number;
    name: string;
    number: string;
    status: string;
}

interface TeacherStore {
    teachers: TeacherItem[];
    getTeachers: () => Promise<void>;
}

const useTeacherStore = create<TeacherStore>((set) => ({
    teachers: [],
    getTeachers: async () => {
        const response = await getTeacherList();
        set({ teachers: response });
    }
}));

export default useTeacherStore;