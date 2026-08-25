"use client";

import { useState } from "react";
import TeacherManagement from "../../components/TeacherManagement";
import NewPeople from "../../modal/NewPeople";

interface TeacherRecord {
  id: number;
  [key: string]: unknown;
}

export default function TeacherManagementPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);

  return (
    <>
      {/* lg 미만: 자체 모달로 상세 편집 */}
      <div className="lg:hidden">
        <TeacherManagement />
      </div>

      {/* lg 이상: 왼쪽 목록, 오른쪽 상세 패널 */}
      <div className="hidden lg:flex gap-6 h-full">
        <div className="w-[45%]">
          <TeacherManagement
            onSelect={setSelectedTeacher}
            selectedId={selectedTeacher?.id ?? null}
          />
        </div>
        <div className="flex-1">
          {selectedTeacher ? (
            <NewPeople
              key={selectedTeacher.id}
              open={true}
              onOpenChange={(open) => { if (!open) setSelectedTeacher(null); }}
              type="teacher"
              initialData={selectedTeacher}
              asPanel
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              선생님을 선택하세요
            </div>
          )}
        </div>
      </div>
    </>
  );
}
