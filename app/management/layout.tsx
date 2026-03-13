import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서빙고 파워웨이브 3부 | 관리 페이지",
  description: "새로운 학생과 선생님을 추가하고 출석 상태를 관리하세요!",
};

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
