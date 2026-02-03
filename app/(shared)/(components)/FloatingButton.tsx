"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Users } from "lucide-react";
import MatchingModal from "../(modal)/MatchingModal";
import Chating from "../(modal)/Chating";
import ExportAttendance from "../(modal)/ExportAttendance";

export default function FloatingButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleMenuToggle = () => {
    // 채팅창이 열려있으면 채팅창을 닫음
    if (isChatOpen) {
      handleChatClose();
      return;
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleChatOpen = () => {
    setIsMenuOpen(false);
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsClosing(true);
    setIsChatOpen(false);
    setTimeout(() => {
      setIsClosing(false);
    }, 300);
  };

  const handleMatchingOpen = () => {
    setIsMenuOpen(false);
    setIsMatchingOpen(true);
  };

  const handleExportOpen = () => {
    setIsMenuOpen(false);
    setIsExportOpen(true);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleMenuToggle}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#2C79FF] hover:bg-[#2C79FF]/90 text-white rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="메뉴"
      >
        {isMenuOpen || isChatOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <span className="font-hakgyoansim text-xl font-bold">PW3</span>
        )}
      </button>

      {/* Menu Buttons */}
      {isMenuOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3 animate-slide-up">
          <button
            onClick={handleChatOpen}
            className="w-16 h-16 bg-white hover:bg-gray-50 rounded-xl shadow-lg border border-gray-200 transition-all flex flex-col items-center justify-center gap-1"
          >
            <MessageCircle className="w-5 h-5 text-[#2C79FF]" />
            <span className="text-[10px] font-medium text-gray-700 leading-tight text-center">AI 채팅</span>
          </button>
          <button
            onClick={handleExportOpen}
            className="w-16 h-16 bg-white hover:bg-gray-50 rounded-xl shadow-lg border border-gray-200 transition-all flex flex-col items-center justify-center gap-1"
          >
            <Send className="w-5 h-5 text-[#2C79FF]" />
            <span className="text-[10px] font-medium text-gray-700 leading-tight text-center">출석부<br/>보내기</span>
          </button>
          <button
            onClick={handleMatchingOpen}
            className="w-16 h-16 bg-white hover:bg-gray-50 rounded-xl shadow-lg border border-gray-200 transition-all flex flex-col items-center justify-center gap-1"
          >
            <Users className="w-5 h-5 text-[#2C79FF]" />
            <span className="text-[10px] font-medium text-gray-700 leading-tight text-center">반 배정<br/>하기</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      <Chating
        isOpen={isChatOpen}
        isClosing={isClosing}
        onClose={handleChatClose}
      />

      {/* Matching Dialog */}
      <MatchingModal 
        open={isMatchingOpen}
        onOpenChange={setIsMatchingOpen}
      />

      {/* Export Attendance Dialog */}
      <ExportAttendance
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />
    </>
  );
}
