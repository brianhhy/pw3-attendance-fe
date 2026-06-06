import AttendanceSummaryCard from "./components/AttendanceSummaryCard";
import TeacherAttendanceSummaryCard from "./components/TeacherAttendanceSummaryCard";
import UpcomingBirthdays from "./components/UpcomingBirthdays";
import QuickActions from "./components/QuickActions";

export default function DashboardPage() {
  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceSummaryCard />
        <TeacherAttendanceSummaryCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-stretch">
        <UpcomingBirthdays />
        <QuickActions />
      </div>
    </div>
  );
}
