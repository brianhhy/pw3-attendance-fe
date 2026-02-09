"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { sendChatMessage } from "../(api)/ai";
import ReactMarkdown from "react-markdown";

interface Message {
  type: "user" | "bot";
  content: string;
  time: string;
}

interface ChatingProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
}

export default function Chating({ isOpen, isClosing, onClose }: ChatingProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [showFirstMessage, setShowFirstMessage] = useState(false);
  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 초기 시간 설정
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    // 1분마다 시간 업데이트
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && !isClosing) {
      // 채팅창이 열릴 때 메시지 순차적으로 표시
      setShowFirstMessage(false);
      setShowSecondMessage(false);
      setShowButtons(false);

      const timer1 = setTimeout(() => setShowFirstMessage(true), 300);
      const timer2 = setTimeout(() => setShowSecondMessage(true), 1000);
      const timer3 = setTimeout(() => setShowButtons(true), 1700);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, isClosing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (isLoading) return;

    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

    // 사용자 메시지 추가
    const userMessage: Message = {
      type: "user",
      content: question,
      time: timeString,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(question);
      
      // AI 응답 추가
      const botMessage: Message = {
        type: "bot",
        content: response.answer || response.message || "응답을 받지 못했습니다.",
        time: timeString,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("AI 채팅 오류:", error);
      const errorMessage: Message = {
        type: "bot",
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        time: timeString,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className={`fixed bottom-24 right-6 z-40 w-96 h-[70vh] bg-white rounded-lg shadow-2xl flex flex-col ${
      isClosing ? "animate-slide-down" : "animate-slide-up"
    }`}>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold text-gray-800">PW3 봇</h3>
        <button 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
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
            {showFirstMessage && (
              <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm animate-slide-up">
                <p className="text-sm text-gray-800">안녕하세요! 무엇을 도와드릴까요? 😊</p>
              </div>
            )}
            
            {/* Second Message */}
            {showSecondMessage && (
              <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm animate-slide-up">
                <p className="text-sm text-gray-800">문의하실 내용을 간단히 입력하시거나, 아래 버튼을 선택해 주세요.</p>
              </div>
            )}
            
            {/* Suggestion Buttons */}
            {showButtons && (
              <div className="flex flex-wrap gap-2 mt-2 animate-slide-up">
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
            )}
          </div>
        </div>

        {/* User and AI Messages */}
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start gap-2 mb-4 ${message.type === "user" ? "flex-row-reverse" : ""}`}>
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
                ) : (
                  <div className="text-sm markdown-content">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="my-1">{children}</p>,
                        ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
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
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
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
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C79FF] text-sm disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isLoading || !inputValue.trim()}
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
