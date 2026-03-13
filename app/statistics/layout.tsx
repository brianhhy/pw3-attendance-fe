import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서빙고 파워웨이브 3부 | 통계 페이지",
  description: "반별 출석률, 요일별 출석률과 같은 다양한 지표를 확인하세요!",
};

export default function StatisticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
