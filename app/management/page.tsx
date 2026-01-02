import AllStudentInquiry from "./components/AllStudentInquiry";
import StudentManagement from "./components/StudentManagement";
import TeacherManagement from "./components/TeacherManagement";

export default function ManagementPage() {
  return (
    <div className="flex h-full gap-6 p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      {/* 왼쪽: 전체 학생 조회 */}
      <AllStudentInquiry />
      
      {/* 오른쪽: 학생 관리 및 선생님 관리 */}
      <div className="min-w-[600px] flex flex-col gap-6">
        <StudentManagement />
        <TeacherManagement />
      </div>
    </div>
  );
}

