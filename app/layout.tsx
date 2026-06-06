import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/app/(shared)/(components)/Header";
import Sidebar from "@/app/(shared)/(components)/Sidebar";
import { Providers } from "./providers";

const gmarketSans = localFont({
  src: [
    {
      path: "../public/fonts/GmarketSansTTFLight.ttf",
      weight: "300",
      style: "light",
    },
    {
      path: "../public/fonts/GmarketSansTTFMedium.ttf",
      weight: "500",
      style: "medium",
    },
    {
      path: "../public/fonts/GmarketSansTTFBold.ttf",
      weight: "700",
      style: "bold",
    },
  ],
  variable: "--font-gmarket-sans",
  display: "swap",
});

const hakgyoansim = localFont({
  src: "../public/fonts/Hakgyoansim Dunggeunmiso TTF B.ttf",
  variable: "--font-hakgyoansim",
  display: "swap",
});

export const metadata: Metadata = {
  title: "서빙고 파워웨이브 3부 | 출석 체크 페이지",
  description: "이름을 검색 후 출석 체크를 완료하세요!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${gmarketSans.variable} ${hakgyoansim.variable}`}>
      <body className="h-screen overflow-hidden">
        <Providers>
          <div className="flex h-full bg-linear-to-b from-[#FFFFFF] to-[#ECEDFF]">
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

        </Providers>
      </body>
    </html>
  );
}


