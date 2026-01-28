"use client";

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold text-lg transition-all relative ${
        isActive
          ? "text-[#2C79FF]"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C79FF]" />
      )}
    </button>
  );
}

