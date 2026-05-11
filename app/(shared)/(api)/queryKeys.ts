export const queryKeys = {
  studentAttendance: (date: string) => ["student-attendance", date] as const,
  teacherAttendance: (date: string) => ["teacher-attendance", date] as const,
  students: () => ["students"] as const,
  teachers: () => ["teachers"] as const,
};
