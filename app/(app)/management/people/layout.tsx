export default function PeopleManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
