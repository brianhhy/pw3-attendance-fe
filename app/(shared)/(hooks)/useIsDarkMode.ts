import { useEffect, useState } from "react";

// 테마 토글은 <html> 클래스를 직접 조작하므로, canvas/SVG처럼 CSS 캐스케이드로
// 색을 못 받는 곳에서 다크모드 여부를 실시간으로 알아야 할 때 이 훅을 쓴다.
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default useIsDarkMode;
