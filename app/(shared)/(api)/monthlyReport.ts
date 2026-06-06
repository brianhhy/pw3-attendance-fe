import axios from "axios";

export interface MonthlyAttendanceReportRequest {
  year: number;
  month: number;
  schoolYear: number;
  weakClassThreshold?: number;
}

export interface MonthlyAttendanceReportResponse {
  year: number;
  month: number;
  schoolYear: number;
  markdown: string;
  reportData?: unknown;
}

const REPORT_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/reports/monthly-attendance`;

export const getCachedMonthlyAttendanceReport = async (
  params: MonthlyAttendanceReportRequest
): Promise<MonthlyAttendanceReportResponse | null> => {
  try {
    const response = await axios.get(`${REPORT_API_BASE_URL}/cache`, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const generateMonthlyAttendanceReport = async (
  payload: MonthlyAttendanceReportRequest
): Promise<MonthlyAttendanceReportResponse> => {
  const response = await axios.post(`${REPORT_API_BASE_URL}/generate`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};
