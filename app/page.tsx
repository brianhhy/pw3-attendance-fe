import StudentAttendance from "./components/StudentAttendance";
import TeacherAttendance from "./components/TeacherAttendance";

export default function Home() {
  return (
    <div className="flex h-full items-center justify-center gap-6 bg-linear-to-b from-[#FFFFFF] to-[#ECEDFF] p-6">
      <StudentAttendance />
      <TeacherAttendance />
    </div>
  );
}
