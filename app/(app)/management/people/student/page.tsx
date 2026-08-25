"use client";

import { useState } from "react";
import StudentManagement from "../../components/StudentManagement";
import NewPeople from "../../modal/NewPeople";

interface StudentRecord {
  id: number;
  [key: string]: unknown;
}

export default function StudentManagementPage() {
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  return (
    <>
      {/* lg 미만: 자체 모달로 상세 편집 */}
      <div className="lg:hidden">
        <StudentManagement />
      </div>

      {/* lg 이상: 왼쪽 목록, 오른쪽 상세 패널 */}
      <div className="hidden lg:flex gap-6 h-full">
        <div className="w-[45%]">
          <StudentManagement
            onSelect={setSelectedStudent}
            selectedId={selectedStudent?.id ?? null}
          />
        </div>
        <div className="flex-1">
          {selectedStudent ? (
            <NewPeople
              key={selectedStudent.id}
              open={true}
              onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}
              type="student"
              initialData={selectedStudent}
              asPanel
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              학생을 선택하세요
            </div>
          )}
        </div>
      </div>
    </>
  );
}
