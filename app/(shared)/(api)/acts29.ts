import axios from "./apiClient";

export interface Acts29SyncResponse {
  date: string;
  schoolYear: number;
  className: string | null;
  result: "DRY_RUN" | "NO_CHANGES" | "SYNCED";
  dryRun: boolean;
  localStudentCount: number;
  remoteStudentCount: number;
  matchedCount: number;
  changedCount: number;
  unmatchedTargetCount: number;
  remotePresentBefore: number;
  remotePresentAfter: number;
  changes: {
    studentId: number;
    studentName: string;
    localStatus: string;
    previousAttendance: string;
    nextAttendance: string;
    targetUserId: string;
  }[];
  matchIssues: { studentId: number; studentName: string; birth: string | null; reason: string }[];
}

type Acts29SyncApiResponse = Omit<Acts29SyncResponse, "date"> & {
  date: string | [number, number, number];
};

export const syncActs29Attendance = async (date: string, dryRun: boolean): Promise<Acts29SyncResponse> => {
  const response = await axios.post<Acts29SyncApiResponse>(
    `${process.env.API_URL}/integrations/acts29/attendances/${encodeURIComponent(date)}/sync`,
    { dryRun, ...(dryRun ? {} : { confirmDate: date }) }
  );
  const data = response.data;
  // 백엔드 LocalDate가 배열로 직렬화되어도 화면과 후속 요청은 YYYY-MM-DD를 사용한다.
  const normalizedDate = Array.isArray(data.date)
    ? data.date.map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0")).join("-")
    : data.date;
  return { ...data, date: normalizedDate };
};
