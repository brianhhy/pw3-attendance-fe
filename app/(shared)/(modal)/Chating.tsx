"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { sendChatMessage } from "../(api)/ai";
import ReactMarkdown from "react-markdown";
import { WaveLoadingText } from "../(animations)/ChattingAnimation";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  time: string;
  isTyping?: boolean;
  displayedChars?: string[];
}

interface ChatingProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
}

export default function Chating({ isOpen, isClosing, onClose }: ChatingProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && !isClosing) {
      setMessages([]);
      setInputValue("");
    } else if (!isOpen) {
      setMessages([]);
      setInputValue("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [isOpen, isClosing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: (question: string) => sendChatMessage(question),
    onMutate: (question) => {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
      setMessages((prev) => [...prev, { id: Date.now().toString(), type: "user", content: question, time: timeString }]);
      setInputValue("");
      return { timeString };
    },
    onSuccess: (response, _question, context) => {
      const timeString = context?.timeString ?? currentTime;
      const fullContent = response.answer || response.message || "응답을 받지 못했습니다.";
      const botMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [...prev, { id: botMessageId, type: "bot", content: fullContent, time: timeString, isTyping: true, displayedChars: [] }]);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      const chars = [...fullContent];
      let charIndex = 0;

      function typeNext() {
        if (charIndex >= chars.length) {
          setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, isTyping: false } : msg));
          return;
        }
        const ch = chars[charIndex++];
        setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, displayedChars: [...(msg.displayedChars ?? []), ch] } : msg));
        let delay = 25 + Math.random() * 20;
        if (".,!?:".includes(ch)) delay = 160 + Math.random() * 120;
        else if (ch === "\n") delay = 220;
        typingTimeoutRef.current = setTimeout(typeNext, delay);
      }
      typeNext();
    },
    onError: (_error, _question, context) => {
      const timeString = context?.timeString ?? currentTime;
      setMessages((prev) => [...prev, { id: (Date.now() + 2).toString(), type: "bot", content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.", time: timeString }]);
    },
  });

  const handleButtonClick = (question: string) => {
    sendMessage(question);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed z-[99999] bg-white shadow-2xl flex flex-col
      sm:bottom-24 sm:right-6 sm:w-96 sm:h-[80vh] sm:max-h-[80vh] sm:rounded-lg
      max-sm:inset-0 max-sm:h-full max-sm:w-full max-sm:rounded-none
      ${isClosing ? "animate-slide-down" : "animate-slide-up"}
    `}>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold text-gray-800">PW3 봇</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {/* Date Divider */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-full">
            오늘
          </span>
        </div>

        {/* Bot Message */}
        <div className="flex items-start gap-2 mb-4">
          <div className="w-10 h-10 bg-[#2C79FF] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="font-hakgyoansim text-sm font-bold text-gray-800 text-white">PW3</span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">PW3 AI 출석 조교</span>
              <span className="text-xs text-gray-500">{currentTime}</span>
            </div>
            
            {/* First Message */}
            <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <p className="text-sm text-gray-800">안녕하세요! 무엇을 도와드릴까요? 😊</p>
            </div>
            
            {/* Second Message */}
            <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "1.3s", animationFillMode: "forwards" }}>
              <p className="text-sm text-gray-800">문의하실 내용을 간단히 입력하시거나, 아래 버튼을 선택해 주세요.</p>
            </div>
            
            {/* Suggestion Buttons */}
            <div className="flex flex-wrap gap-2 mt-2 opacity-0 animate-fade-in-up" style={{ animationDelay: "2.3s", animationFillMode: "forwards" }}>
                <button 
                  onClick={() => handleButtonClick("이번 달 한 번도 안 나온 학생 알려줘")}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  장기 결석자 조회
                </button>
                <button 
                  onClick={() => handleButtonClick("3주 연속 결석한 학생")}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  연속 결석자 조회
                </button>
                <button 
                  onClick={() => handleButtonClick("지각이 잦은 학생 알려줘")}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  지각률 높은 학생
                </button>
                <button 
                  onClick={() => handleButtonClick("학년별 출석률 알려줘")}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  학년별 평균 출석률
                </button>
                <button 
                  onClick={() => handleButtonClick("관리가 필요한 학생")}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  관리 필요 학생 조회
                </button>
                <button 
                  onClick={() => handleButtonClick("신입생 중 연속 출석한 학생")}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  신입생 정착 현황
                </button>
              </div>
          </div>
        </div>

        {/* User and AI Messages */}
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-2 mb-4 ${message.type === "user" ? "flex-row-reverse" : ""}`}>
            {message.type === "bot" && (
              <div className="w-10 h-10 bg-[#2C79FF] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-hakgyoansim text-sm font-bold text-white">PW3</span>
              </div>
            )}
            <div className="flex flex-col gap-1 flex-1">
              <div className={`flex items-center gap-2 ${message.type === "user" ? "justify-end" : ""}`}>
                {message.type === "bot" && <span className="text-xs font-medium text-gray-700">PW3 봇</span>}
                <span className="text-xs text-gray-500">{message.time}</span>
                {message.type === "user" && <span className="text-xs font-medium text-gray-700">나</span>}
              </div>
              <div className={`rounded-2xl p-3 shadow-sm ${
                message.type === "user" 
                  ? "bg-[#2C79FF] text-white rounded-tr-none ml-auto" 
                  : "bg-white text-gray-800 rounded-tl-none"
              }`}>
                {message.type === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : message.isTyping ? (
                  <div className="text-sm leading-relaxed">
                    {(message.displayedChars ?? []).map((ch, i) =>
                      ch === "\n" ? (
                        <br key={i} />
                      ) : (
                        <span key={i} className="typing-token">{ch}</span>
                      )
                    )}
                    <span className="typing-cursor" />
                  </div>
                ) : (
                  <div className="text-sm markdown-content">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="my-1" {...props} />,
                        ul: ({ node, ...props }) => <ul className="my-1 ml-4 list-disc" {...props} />,
                        ol: ({ node, ...props }) => <ol className="my-1 ml-4 list-decimal" {...props} />,
                        li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 mb-4">
            <div className="w-10 h-10 bg-[#2C79FF] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-hakgyoansim text-sm font-bold text-white">PW3</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm">
              <WaveLoadingText />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <form onSubmit={handleInputSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력해주세요."
            disabled={isLoading || messages.some((m) => m.isTyping)}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C79FF] text-sm disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isLoading || messages.some((m) => m.isTyping) || !inputValue.trim()}
            className="p-3 bg-[#2C79FF] hover:bg-[#2C79FF]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
