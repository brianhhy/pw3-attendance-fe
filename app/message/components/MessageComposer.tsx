"use client";

interface MessageComposerProps {
  step: number;
  message: string;
  selectedRecipients: number[];
  onMessageChange: (message: string) => void;
  onSend: () => void;
}

export default function MessageComposer({
  step,
  message,
  selectedRecipients,
  onMessageChange,
  onSend,
}: MessageComposerProps) {
  return (
    <div
      className={`transition-all duration-500 delay-450 ${
        step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#2C79FF] text-white flex items-center justify-center font-bold">
          4
        </div>
        <h2 className="text-2xl font-bold text-gray-800">메시지를 작성하고 전송하세요!</h2>
      </div>

      <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 p-6 h-[630px] flex flex-col">
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="메시지를 입력해주세요"
          disabled={selectedRecipients.length === 0}
          className="w-full flex-1 p-4 rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#2C79FF] disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={90}
        />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{message.length} / 90자</span>
            <button
              disabled={selectedRecipients.length === 0}
              className="text-[#2C79FF] text-sm font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              파일 첨부하기
            </button>
          </div>
        </div>

        <button
          onClick={onSend}
          disabled={selectedRecipients.length === 0 || !message.trim()}
          className="w-full mt-6 px-6 py-4 rounded-full bg-[#2C79FF] text-white font-bold text-lg hover:bg-[#1E5FE6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          메시지 전송하기
        </button>
      </div>
    </div>
  );
}
