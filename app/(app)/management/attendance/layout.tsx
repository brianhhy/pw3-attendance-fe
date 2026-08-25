export default function AttendanceManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 px-6 pt-6 pb-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
