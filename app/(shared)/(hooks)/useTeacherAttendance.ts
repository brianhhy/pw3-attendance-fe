import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeacherAttendances,
  markTeacherAttendance,
} from "../(api)/attendance";
import { queryKeys } from "../(api)/queryKeys";

export type TeacherAttendanceStatuses = {
  [teacherId: number]: { status?: string };
};

const parseTeacherAttendanceResponse = (
  response: unknown
): TeacherAttendanceStatuses => {
  const statuses: TeacherAttendanceStatuses = {};

  if (Array.isArray(response)) {
    response.forEach((item: any) => {
      const teacherId = item.teacherId || item.teacher_id || item.id;
      const status =
        item.status || item.attendanceStatus || item.attendance_status;
      if (teacherId) {
        statuses[teacherId] = { status };
      }
    });
  } else if (response && typeof response === "object") {
    Object.keys(response as object).forEach((key) => {
      const item = (response as any)[key];
      const teacherId =
        item?.teacherId || item?.teacher_id || item?.id || Number(key);
      const status =
        item?.status || item?.attendanceStatus || item?.attendance_status;
      if (teacherId) {
        statuses[teacherId] = { status };
      }
    });
  }

  return statuses;
};

export function useTeacherAttendanceQuery(date: string) {
  return useQuery({
    queryKey: queryKeys.teacherAttendance(date),
    queryFn: async (): Promise<TeacherAttendanceStatuses> => {
      const response = await getTeacherAttendances(date);
      return parseTeacherAttendanceResponse(response);
    },
  });
}

export function useMarkTeacherAttendance(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      status,
    }: {
      teacherId: number;
      status: "ATTEND" | "LATE" | "ABSENT";
    }) => markTeacherAttendance(teacherId, status, date),

    onMutate: async ({ teacherId, status }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.teacherAttendance(date),
      });

      const snapshot = queryClient.getQueryData<TeacherAttendanceStatuses>(
        queryKeys.teacherAttendance(date)
      );

      queryClient.setQueryData<TeacherAttendanceStatuses>(
        queryKeys.teacherAttendance(date),
        (old) => ({ ...old, [teacherId]: { status } })
      );

      return { snapshot };
    },

    onError: (_err, _variables, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(
          queryKeys.teacherAttendance(date),
          context.snapshot
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherAttendance(date),
      });
    },
  });
}

export const getTeacherAttendanceStatus = (
  statuses: TeacherAttendanceStatuses,
  teacherId: number
): "ATTEND" | "LATE" | null => {
  const status = statuses[teacherId]?.status;
  if (!status) return null;
  const upper = String(status).toUpperCase();
  if (upper === "ATTEND" || upper === "ATTENDED") return "ATTEND";
  if (upper === "LATE") return "LATE";
  return null;
};

export const isTeacherAttendanceMarked = (
  statuses: TeacherAttendanceStatuses,
  teacherId: number
): boolean => {
  const status = statuses[teacherId]?.status;
  if (!status) return false;
  const upper = String(status).toUpperCase();
  return upper === "ATTEND" || upper === "ATTENDED" || upper === "LATE";
};

export const getTeacherAttendanceErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    if (axiosError.response?.status === 400) {
      const serverMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "잘못된 요청입니다.";
      return `잘못된 요청입니다: ${serverMessage}`;
    }
    if (axiosError.response?.status === 500) {
      return "서버 오류가 발생했습니다. 날짜가 올바른지 확인해주세요.";
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return "출석 체크 중 오류가 발생했습니다.";
};
