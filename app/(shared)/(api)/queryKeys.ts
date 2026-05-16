export const queryKeys = {
  studentAttendance: (date: string) => ["student-attendance", date] as const,
  teacherAttendance: (date: string) => ["teacher-attendance", date] as const,
  students: () => ["students"] as const,
  teachers: () => ["teachers"] as const,
  attendanceManagement: (date: string) => ["attendance-management", date] as const,
  monthlyStudents: (year: number) => ["monthly-students", year] as const,
  parentAttendanceStats: (date: string) => ["parent-attendance-stats", date] as const,
  birthdays: (month: number) => ["birthdays", month] as const,
  attendanceReport: (date: string) => ["attendance-report", date] as const,
  studentsList: () => ["students-list"] as const,
  teachersList: () => ["teachers-list"] as const,
  classesByYear: (year: number) => ["classes-by-year", year] as const,
};
