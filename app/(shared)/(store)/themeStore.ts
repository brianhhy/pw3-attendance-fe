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

const THEME_TRANSITION_DURATION = 350;

// isDark 초기값은 항상 false로 두고, 마운트 시 syncTheme으로 실제 DOM 상태와 맞춘다 (SSR/CSR 불일치 방지).
const useThemeStore = create<ThemeStore>((set, get) => ({
    isDark: false,

    toggleTheme: () => {
        const next = !get().isDark;
        const root = document.documentElement;
        const updateTheme = () => {
            applyTheme(next);
            set({ isDark: next });
        };

        // View Transition API는 배경 이미지/그라데이션까지 자연스럽게 교차 전환한다.
        // 지원하지 않는 브라우저에서는 아래 CSS 색상 트랜지션으로 동일하게 폴백한다.
        if (document.startViewTransition) {
            document.startViewTransition(updateTheme);
            return;
        }

        root.classList.add("theme-transitioning");
        updateTheme();
        window.setTimeout(() => {
            root.classList.remove("theme-transitioning");
        }, THEME_TRANSITION_DURATION);
    },

    syncTheme: () => {
        set({ isDark: document.documentElement.classList.contains("dark") });
    },
}));

export default useThemeStore;
