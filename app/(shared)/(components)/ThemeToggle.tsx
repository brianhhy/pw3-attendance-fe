"use client";

import { Sun, Moon } from "lucide-react";
import useThemeStore from "../(store)/themeStore";

const ThemeToggle = ({ className = "" }: { className?: string }) => {
    const { isDark, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            aria-label="다크 모드 전환"
            aria-pressed={isDark}
            className={`relative w-[68px] h-8 shrink-0 rounded-full border-2 transition-colors duration-300 ${
                isDark ? "border-black bg-yellow-300" : "border-[#467FE0] bg-transparent"
            } ${className}`}
        >
            <span
                className={`absolute top-0.5 h-6 w-6 rounded-full shadow flex items-center justify-center transition-all duration-300 ${
                    isDark ? "left-[calc(100%-28px)] bg-black" : "left-0.5 bg-white"
                }`}
            >
                {isDark ? (
                    <Moon className="w-3.5 h-3.5 text-yellow-300" />
                ) : (
                    <Sun className="w-3.5 h-3.5 text-gray-900" />
                )}
            </span>
            <span
                className={`absolute top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wide transition-all duration-300 ${
                    isDark ? "left-2.5 text-gray-900" : "right-2.5 text-gray-700 dark:text-white"
                }`}
            >
                {isDark ? "ON" : "OFF"}
            </span>
        </button>
    );
};

export default ThemeToggle;
