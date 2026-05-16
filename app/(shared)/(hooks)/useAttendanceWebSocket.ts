"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../(api)/queryKeys";
import type { ClassData } from "./useStudentAttendance";

interface AttendanceMessage {
  type: "STUDENT" | "TEACHER";
  id: number;
  name: string;
  status: "ATTEND" | "LATE" | "ABSENT";
  timestamp: string;
}

const mapStatus = (status: string): ClassData["students"][number]["status"] => {
  if (status === "ATTEND") return "attended";
  if (status === "LATE") return "late";
  if (status === "ABSENT") return "absent";
  return undefined;
};

export function useAttendanceWebSocket(date: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () =>
        new SockJS("https://api.pw3hub.xyz/ws-attendance"),
      onConnect: () => {
        console.log("[WS] 연결 성공");
        client.subscribe("/topic/attendance", (message) => {
          const data: AttendanceMessage = JSON.parse(message.body);
          const mappedStatus = mapStatus(data.status);
          if (!mappedStatus) return;

          queryClient.setQueryData<ClassData[]>(
            queryKeys.studentAttendance(date),
            (old) =>
              old?.map((classItem) => ({
                ...classItem,
                students: classItem.students.map((student) =>
                  student.studentClassId === data.id
                    ? { ...student, status: mappedStatus }
                    : student
                ),
              })) ?? []
          );
        });
      },
      onStompError: (frame) => {
        console.error("[WS] STOMP 에러:", frame);
      },
      onWebSocketError: (event) => {
        console.error("[WS] WebSocket 에러:", event);
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [date, queryClient]);
}
