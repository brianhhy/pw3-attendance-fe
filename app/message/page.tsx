"use client";

import { useState, useEffect, useMemo } from "react";
import useAttendanceStore from "../(shared)/(store)/attendanceStore";
import RecipientSelector from "./components/RecipientSelector";
import MessageComposer from "./components/MessageComposer";

type MessageTarget = "student" | "parent" | null;
type MessageMethod = "message" | "kakao" | null;

interface Recipient {
  id: number;
  name: string;
  displayName: string;
  grade: string;
  phone: string;
}

export default function MessagePage() {
  const { students, getStudents } = useAttendanceStore();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<MessageTarget>(null);
  const [method, setMethod] = useState<MessageMethod>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getStudents();
  }, [getStudents]);

  // target에 따라 수신자 목록 필터링
  const recipients: Recipient[] = useMemo(() => {
    if (!target) return [];

    const currentYear = String(new Date().getFullYear());

    return students
      .filter((student) => {
        // 학생 선택 시: 모든 학생
        if (target === "student") return true;
        // 학부모 선택 시: parentPhone이 있는 학생만
        if (target === "parent") return student.parentPhone !== null && student.parentPhone !== "";
        return false;
      })
      .map((student) => {
        const classes = student.classesByYear?.[currentYear];
        let gradeText = "";
        if (classes && classes.length > 0) {
          const firstClass = classes[0];
          const schoolLabel = firstClass.schoolType === "MIDDLE" ? "중학교" : "고등학교";
          gradeText = `${schoolLabel} ${firstClass.grade}학년 ${firstClass.classNumber}반`;
        }

        return {
          id: student.id,
          name: student.name,
          displayName: target === "parent" ? `${student.name}의 부모님` : student.name,
          grade: gradeText || "미지정",
          phone: target === "parent" ? (student.parentPhone || "") : (student.phone || ""),
        };
      });
  }, [students, target]);

  const handleTargetSelect = (selectedTarget: MessageTarget) => {
    setTarget(selectedTarget);
    setSelectedRecipients([]); // 대상 변경 시 선택 초기화
    setTimeout(() => setStep(2), 300);
  };

  const handleMethodSelect = (selectedMethod: MessageMethod) => {
    setMethod(selectedMethod);
    setTimeout(() => setStep(3), 300);
  };

  const toggleRecipient = (id: number) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((recipientId) => recipientId !== id) : [...prev, id]
    );
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map((r) => r.id));
    }
  };

  const handleSend = () => {
    // TODO: 메시지 전송 API 호출
    console.log("전송:", { target, method, selectedRecipients, message });
  };

  return (
    <div className="w-full min-h-screen p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 단계 1~3 */}
          <div className="space-y-6">
            {/* 1단계: 메시지 대상 선택 */}
            <div
              className={`transition-all duration-500 ${
                step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#2C79FF] text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-800">메시지 대상을 선택해주세요!</h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTargetSelect("student")}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    target === "student"
                      ? "bg-[#2C79FF] text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  학생
                </button>
                <button
                  onClick={() => handleTargetSelect("parent")}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    target === "parent"
                      ? "bg-[#2C79FF] text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  학부모
                </button>
              </div>
            </div>

            {/* 2단계: 메시지 전송 수단 선택 */}
            <div
              className={`transition-all duration-500 delay-150 ${
                step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#2C79FF] text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-800">메시지 전송 수단을 선택해주세요!</h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleMethodSelect("message")}
                  disabled={!target}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    method === "message"
                      ? "bg-[#2C79FF] text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  메시지
                </button>
                <button
                  onClick={() => handleMethodSelect("kakao")}
                  disabled={!target}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    method === "kakao"
                      ? "bg-[#2C79FF] text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  카카오톡
                </button>
              </div>
            </div>

            {/* 3단계: 수신자 선택 */}
            <RecipientSelector
              step={step}
              method={method}
              target={target}
              recipients={recipients}
              selectedRecipients={selectedRecipients}
              onToggleRecipient={toggleRecipient}
              onToggleAllRecipients={toggleAllRecipients}
            />
          </div>

          {/* 오른쪽: 4단계 메시지 작성 */}
          <MessageComposer
            step={step}
            message={message}
            selectedRecipients={selectedRecipients}
            onMessageChange={setMessage}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}
