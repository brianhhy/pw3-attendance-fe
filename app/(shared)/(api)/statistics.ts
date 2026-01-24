import axios from "axios";

export type SundayAttendanceSummaryItem = {
  attendanceDate: [number, number, number]; // [YYYY, M, D]
  attendedCount: number;
  totalCount: number;
};

// 일요일별 전체 출석 요약 조회
export const getSundayAttendanceSummary = async () => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/attendances/summary/sundays`
  );
  return response.data as SundayAttendanceSummaryItem[];
};

