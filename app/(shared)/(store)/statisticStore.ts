import { create } from "zustand";
import { getSundayAttendanceSummary, type SundayAttendanceSummaryItem } from "../(api)/statistics";
import { getGradeSundayStats } from "../(api)/attendance";

export type GradeSundayStat = {
    sunday: [number, number, number];
    attendedCount: number;
    totalCount: number;
    attendanceRate: number;
};

export type GradeData = {
    schoolType: "MIDDLE" | "HIGH";
    grade: 1 | 2 | 3;
    gradeName: string;
    sundayStats: GradeSundayStat[];
};

interface StatisticStore {
    sundaySummary: SundayAttendanceSummaryItem[];
    gradeSundayStats: GradeData[];
    isLoading: boolean;
    fetchAll: () => Promise<void>;
}

const useStatisticStore = create<StatisticStore>((set) => ({
    sundaySummary: [],
    gradeSundayStats: [],
    isLoading: false,

    fetchAll: async () => {
        set({ isLoading: true });
        try {
            const [sundaySummary, gradeSundayStats] = await Promise.all([
                getSundayAttendanceSummary(),
                getGradeSundayStats(),
            ]);
            set({
                sundaySummary: Array.isArray(sundaySummary) ? sundaySummary : [],
                gradeSundayStats: Array.isArray(gradeSundayStats) ? gradeSundayStats : [],
            });
        } catch (error) {
            console.error("통계 데이터 조회 실패:", error);
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useStatisticStore;
