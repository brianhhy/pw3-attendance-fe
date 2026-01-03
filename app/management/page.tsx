import StudentManagement from "./components/StudentManagement";
import TeacherManagement from "./components/TeacherManagement";
import AttendanceManagement from "./components/AttendanceManagement";

export default function ManagementPage() {
  return (
    <div className="flex h-full gap-6 p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      {/* 학생 관리 및 선생님 관리 */}
      <div className="min-w-[600px] flex flex-col gap-6">
        <StudentManagement />
        <TeacherManagement />
      </div>
      {/* 출석 관리 */}
      <div className="flex-1 flex flex-col">
        <AttendanceManagement />
      </div>
    </div>
  );
}

