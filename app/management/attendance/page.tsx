"use client";

import { useState } from "react";
import Calendar from "../components/Calendar";
import AttendanceManagement from "../components/AttendanceManagement";
import useAttendanceStore from "../../(shared)/(store)/attendanceStore";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AttendancePage() {
  const [hasSelected, setHasSelected] = useState(false);
  const { selectedDate } = useAttendanceStore();

  const handleSelect = () => setHasSelected(true);
  const handleBack = () => setHasSelected(false);

  return (
    <div className="h-full bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF] overflow-hidden flex flex-col">

      {/* 브레드크럼 */}
      <div className="px-5 pt-3 pb-1 flex-shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {hasSelected ? (
                <BreadcrumbLink
                  onClick={handleBack}
                  className="cursor-pointer text-[#2C79FF] hover:text-[#1a5fd4]"
                >
                  날짜 선택
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-[#2C79FF] font-semibold">
                  날짜 선택
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {hasSelected && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    {selectedDate}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-hidden">

        {/* ===== lg 이상: 사이드바이사이드 ===== */}
        <div className="hidden lg:flex h-full">
          <div
            className="flex-shrink-0 flex items-start justify-center pt-12 p-6 transition-all duration-500 ease-in-out"
            style={{ width: hasSelected ? "680px" : "100%" }}
          >
            <Calendar onSelect={handleSelect} />
          </div>
          <div
            className={`flex-1 overflow-hidden transition-all duration-500 ease-in-out ${
              hasSelected
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8 pointer-events-none"
            }`}
          >
            {hasSelected && <AttendanceManagement />}
          </div>
        </div>

        {/* ===== lg 미만: 하나씩 전환 ===== */}
        <div className="lg:hidden h-full overflow-auto">
          {!hasSelected ? (
            <div className="flex items-start justify-center pt-8 p-4">
              <Calendar onSelect={handleSelect} />
            </div>
          ) : (
            <div className="h-full animate-fade-in-up">
              <AttendanceManagement />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
