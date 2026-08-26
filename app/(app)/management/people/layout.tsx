export default function PeopleManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] dark:from-gray-900 dark:to-gray-950 flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-y-auto scrollbar-none">
        {children}
      </div>
    </div>
  );
}
