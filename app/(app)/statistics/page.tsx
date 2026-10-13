"use client";

import { useEffect } from "react";
import OverallAttendance from "./components/OverallAttendance";
import MonthlyRegisteredStudents from "./components/MonthlyRegisteredStudents";
import GradeAttendance from "./components/GradeAttendance";
import useStatisticStore from "../../(shared)/(store)/statisticStore";

export default function StatisticsPage() {
  const { fetchAll } = useStatisticStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <OverallAttendance />
          <MonthlyRegisteredStudents />
        </div>
        <GradeAttendance />
      </div>
    </div>
  );
}
