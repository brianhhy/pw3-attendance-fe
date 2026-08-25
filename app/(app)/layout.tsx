import Header from "@/app/(shared)/(components)/Header";
import Sidebar from "@/app/(shared)/(components)/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-linear-to-b from-[#FFFFFF] to-[#ECEDFF] dark:from-gray-900 dark:to-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Right: Header + Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
