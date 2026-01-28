"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#2C79FF] hover:bg-[#2C79FF]/90 text-white rounded-4xl shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="AI 채팅"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <span className="font-hakgyoansim text-xl font-bold">PW3</span>
        )}
      </button>

      {/* 채팅 패널 - 추후 구현 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-[#2C79FF] text-white rounded-t-lg">
            <h3 className="font-semibold">AI 채팅</h3>
            <p className="text-sm opacity-90">궁금한 점을 물어보세요</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center text-gray-500 text-sm">
              채팅 기능 준비 중...
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C79FF] focus:border-transparent"
                disabled
              />
              <button
                className="px-4 py-2 bg-[#2C79FF] text-white rounded-lg hover:bg-[#2C79FF]/90 disabled:opacity-50"
                disabled
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
