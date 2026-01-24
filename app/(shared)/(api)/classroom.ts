import axios from "axios";

export interface ClassRoom {
  id: number;
  schoolType: string; // "MIDDLE" | "HIGH" | "ELEMENTARY"
  grade: number;
  classNumber: number;
  name: string;
  teacherName?: string | null;
}

export interface ClassRoomSundaySummaryItem {
  sunday: [number, number, number]; // [YYYY, M, D]
  attendedCount: number;
  totalCount: number;
}

// 전체 반 조회
export const getClassRooms = async (): Promise<ClassRoom[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/class-rooms`);
  return response.data;
};

// 특정 반의 일요일별 출석 요약 조회
export const getClassRoomSundaySummary = async (classRoomId: number): Promise<ClassRoomSundaySummaryItem[]> => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/attendances/classrooms/${classRoomId}/sundays/summary`
  );
  return response.data;
};
