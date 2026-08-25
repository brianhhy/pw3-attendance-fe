"use client";

import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchProps {
  isOpen: boolean;
  searchQuery: string;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export default function Search({
  isOpen,
  searchQuery,
  onToggle,
  onSearchChange,
  placeholder = "이름을 입력하세요"
}: SearchProps) {
  return (
    <div
      className={`relative flex items-center overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
        isOpen ? "w-64" : "w-10"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="검색"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`pl-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
    </div>
  );
}
