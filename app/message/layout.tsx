import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서빙고 파워웨이브 3부 | 메시지 페이지",
  description: "학생과 학부모에게 메시지를 보내보세요!",
};

export default function MessageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
