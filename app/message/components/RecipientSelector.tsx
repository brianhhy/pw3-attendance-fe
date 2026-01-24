"use client";

import { useState } from "react";

type MessageMethod = "message" | "kakao" | null;
type MessageTarget = "student" | "parent" | null;

interface Recipient {
  id: number;
  name: string;
  displayName: string;
  grade: string;
  phone: string;
}

interface RecipientSelectorProps {
  step: number;
  method: MessageMethod;
  target: MessageTarget;
  recipients: Recipient[];
  selectedRecipients: number[];
  onToggleRecipient: (id: number) => void;
  onToggleAllRecipients: () => void;
}

export default function RecipientSelector({
  step,
  method,
  target,
  recipients,
  selectedRecipients,
  onToggleRecipient,
  onToggleAllRecipients,
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipients = recipients.filter((recipient) =>
    searchQuery ? recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div
      className={`transition-all duration-500 delay-300 ${
        step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#2C79FF] text-white flex items-center justify-center font-bold">
            3
          </div>
          <h2 className="text-2xl font-bold text-gray-800">수신자를 선택해주세요!</h2>
        </div>
        <span className="text-sm text-gray-600 font-semibold bg-white/60 px-4 py-2 rounded-full">
          {selectedRecipients.length} / {recipients.length}명 선택
        </span>
      </div>

      <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 p-4 h-[388px] flex flex-col">
        {/* 검색창 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="학생명을 입력해주세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!method}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2C79FF] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={onToggleAllRecipients}
            disabled={!method}
            className="px-6 py-3 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체 선택
          </button>
        </div>

        {/* 수신자 목록 */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {target === "parent"
                ? "학부모 연락처가 등록된 학생이 없습니다."
                : "학생이 없습니다."}
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">검색 결과가 없습니다.</div>
          ) : (
            filteredRecipients.map((recipient) => (
              <label
                key={recipient.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(recipient.id)}
                  onChange={() => onToggleRecipient(recipient.id)}
                  disabled={!method}
                  className="w-5 h-5 text-[#2C79FF] rounded focus:ring-[#2C79FF] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{recipient.displayName}</div>
                  <div className="text-sm text-gray-600">{recipient.grade}</div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
