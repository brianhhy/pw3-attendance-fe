import { create } from "zustand";

interface ThemeStore {
    isDark: boolean;
    toggleTheme: () => void;
    syncTheme: () => void;
}

const applyTheme = (isDark: boolean) => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
        // localStorage 접근이 막혀 있어도 다크모드 토글 자체는 동작하게 둔다.
    }
};

// isDark 초기값은 항상 false로 두고, 마운트 시 syncTheme으로 실제 DOM 상태와 맞춘다 (SSR/CSR 불일치 방지).
const useThemeStore = create<ThemeStore>((set, get) => ({
    isDark: false,

    toggleTheme: () => {
        const next = !get().isDark;
        applyTheme(next);
        set({ isDark: next });
    },

    syncTheme: () => {
        set({ isDark: document.documentElement.classList.contains("dark") });
    },
}));

export default useThemeStore;
