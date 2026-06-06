"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { X, Sparkles } from "lucide-react";

const Chating = dynamic(() => import("../(modal)/Chating"), { ssr: false });

export default function AIButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setIsChatOpen(false);
    setTimeout(() => setIsClosing(false), 300);
  };

  const handleToggle = () => {
    if (isChatOpen) {
      handleClose();
    } else {
      setIsChatOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#2C79FF] hover:bg-[#2C79FF]/90 text-white rounded-4xl shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="AI 채팅"
      >
        {isChatOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-7 h-7" />
        )}
      </button>

      <Chating
        isOpen={isChatOpen}
        isClosing={isClosing}
        onClose={handleClose}
      />
    </>
  );
}
