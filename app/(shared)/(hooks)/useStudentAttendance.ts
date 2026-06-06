import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  getStudentAttendances,
  markStudentAttendance,
  type AttendanceClassItem,
  type AttendanceStudentItem,
} from "../(api)/attendance";
import {
  getStudentClassesByYear,
  type StudentClassItem,
  type StudentClassStudentItem,
} from "../(api)/student";
import { queryKeys } from "../(api)/queryKeys";

export interface ClassData {
  id?: number;
  schoolType: string;
  grade: number;
  classNumber: number;
  className: string;
  teacherName: string;
  students: Array<{
    id: number;
    name: string;
    studentClassId?: number;
    status?: "attended" | "late" | "absent" | "other";
  }>;
}

type AttendanceStatus = "attended" | "late" | "absent" | "other";

const mapStatus = (status: string): AttendanceStatus | undefined => {
  const upper = status.toUpperCase();
  if (upper === "ATTEND") return "attended";
  if (upper === "LATE") return "late";
  if (upper === "ABSENT") return "absent";
  if (upper === "OTHER") return "other";
  return undefined;
};

const buildAttendanceMap = (attendanceResponse: AttendanceClassItem[]) => {
  const map: { [classRoomId: number]: { [studentClassId: number]: string } } =
    {};
  attendanceResponse.forEach((classItem) => {
    const classRoomId = classItem.classRoomId ?? classItem.class_room_id;
    if (classRoomId != null && classItem.students) {
      map[classRoomId] = {};
      classItem.students.forEach((student: AttendanceStudentItem) => {
        const studentClassId =
          student.studentClassId ?? student.student_class_id;
        if (studentClassId != null && student.status) {
          map[classRoomId][studentClassId] = student.status;
        }
      });
    }
  });
  return map;
};

const getSchoolTypePriority = (schoolType: string) => {
  if (schoolType === "MIDDLE") return 1;
  if (schoolType === "ELEMENTARY") return 2;
  if (schoolType === "HIGH") return 3;
  return 4;
};

export function useStudentAttendanceQuery(date: string) {
  return useQuery({
    queryKey: queryKeys.studentAttendance(date),
    queryFn: async (): Promise<ClassData[]> => {
      const [classResponse, attendanceResponse] = await Promise.all([
        getStudentClassesByYear(2026),
        getStudentAttendances(2026, date),
      ]);

      const attendanceMap = buildAttendanceMap(attendanceResponse);

      const transformed = classResponse.map((classItem: StudentClassItem) => {
        const classRoomId = classItem.classRoomId;
        const classAttendance = attendanceMap[classRoomId] ?? {};

        const students =
          classItem.students?.map((student: StudentClassStudentItem) => {
            const status = classAttendance[student.id];
            return {
              id: student.studentId,
              name: student.studentName,
              studentClassId: student.id,
              status: status ? mapStatus(status) : undefined,
            };
          }) ?? [];

        return {
          id: classItem.classRoomId,
          schoolType: classItem.schoolType,
          grade: classItem.grade,
          classNumber: classItem.classNumber,
          className:
            classItem.className ||
            `${classItem.grade}학년 ${classItem.classNumber}반`,
          teacherName: classItem.teacherName || "담임 미지정",
          students,
        };
      });

      return transformed.sort((a, b) => {
        const pa = getSchoolTypePriority(a.schoolType);
        const pb = getSchoolTypePriority(b.schoolType);
        if (pa !== pb) return pa - pb;
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.classNumber - b.classNumber;
      });
    },
  });
}

export function useMarkStudentAttendance(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentClassId,
      status,
    }: {
      studentId: number;
      studentClassId: number;
      status: "ATTEND" | "LATE" | "ABSENT" | "OTHER";
    }) => markStudentAttendance(studentClassId, date, status),

    onMutate: async ({ studentId, studentClassId, status }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.studentAttendance(date),
      });

      const snapshot = queryClient.getQueryData<ClassData[]>(
        queryKeys.studentAttendance(date)
      );

      const mappedStatus = mapStatus(status) ?? "attended";

      queryClient.setQueryData<ClassData[]>(
        queryKeys.studentAttendance(date),
        (old) =>
          old?.map((classItem) => ({
            ...classItem,
            students: classItem.students.map((student) =>
              student.id === studentId &&
              student.studentClassId === studentClassId
                ? { ...student, status: mappedStatus }
                : student
            ),
          })) ?? []
      );

      return { snapshot };
    },

    onError: (_err, _variables, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(
          queryKeys.studentAttendance(date),
          context.snapshot
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentAttendance(date),
      });
    },
  });
}

export const getStudentAttendanceErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 400) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "잘못된 요청입니다.";
      return `잘못된 요청입니다: ${serverMessage}`;
    }
    if (error.response?.status === 500) {
      return "서버 오류가 발생했습니다. 날짜가 올바른지 확인해주세요.";
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "출석 체크 중 오류가 발생했습니다.";
};
