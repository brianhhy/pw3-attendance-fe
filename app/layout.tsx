import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/app/(shared)/(components)/Header";
import Sidebar from "@/app/(shared)/(components)/Sidebar";
import FloatingButton from "@/app/(shared)/(components)/FloatingButton";

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
  title: "서빙고 파워웨이브 3부",
  description: "서빙고 파워웨이브 3부 출석부",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${gmarketSans.variable} ${hakgyoansim.variable}`}>
      <body className="h-screen overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="w-full">
            <Header />
          </div>

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Floating Button */}
        <FloatingButton />
      </body>
    </html>
  );
}


