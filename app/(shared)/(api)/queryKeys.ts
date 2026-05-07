export const queryKeys = {
  studentAttendance: (date: string) => ["student-attendance", date] as const,
  teacherAttendance: (date: string) => ["teacher-attendance", date] as const,
};
