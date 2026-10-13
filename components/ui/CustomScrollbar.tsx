"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface CustomScrollbarProps {
  children: ReactNode;
  /** 바깥 래퍼(relative 컨테이너)에 적용할 클래스. 보통 부모의 flex-1/min-h-0/h-full을 그대로 전달한다. */
  className?: string;
  /** 실제로 스크롤되는 내부 컨테이너에 적용할 클래스. */
  contentClassName?: string;
  /** 스크롤 막대(thumb)가 가질 수 있는 최대 높이(px). 콘텐츠가 조금만 넘칠 때 막대가 트랙을 꽉 채우는 것을 막는다. */
  maxThumbHeight?: number;
}

// 네이티브 스크롤바를 숨기고, 콘텐츠 비율과 무관하게 최대 길이가 제한된 막대를 오버레이로 그려준다.
export default function CustomScrollbar({
  children,
  className = "",
  contentClassName = "",
  maxThumbHeight = 64,
}: CustomScrollbarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });
  const dragRef = useRef<{ startY: number; startScrollTop: number; thumbHeight: number } | null>(null);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;

    if (scrollHeight <= clientHeight + 1) {
      setThumb((prev) => (prev.visible ? { height: 0, top: 0, visible: false } : prev));
      return;
    }

    const proportionalHeight = (clientHeight / scrollHeight) * clientHeight;
    const height = Math.max(24, Math.min(maxThumbHeight, proportionalHeight));
    const maxTop = clientHeight - height;
    const maxScroll = scrollHeight - clientHeight;
    const top = maxScroll > 0 ? (scrollTop / maxScroll) * maxTop : 0;

    setThumb({ height, top, visible: true });
  }, [maxThumbHeight]);

  useEffect(() => {
    updateThumb();
    const el = scrollRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [updateThumb, children]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop, thumbHeight: thumb.height };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !el) return;
      const { scrollHeight, clientHeight } = el;
      const maxTop = clientHeight - drag.thumbHeight;
      const maxScroll = scrollHeight - clientHeight;
      if (maxTop <= 0 || maxScroll <= 0) return;
      const deltaY = moveEvent.clientY - drag.startY;
      el.scrollTop = drag.startScrollTop + (deltaY / maxTop) * maxScroll;
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateThumb}
        className={`h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${contentClassName}`}
      >
        {children}
      </div>
      {thumb.visible && (
        <div
          onMouseDown={handleThumbMouseDown}
          className="absolute right-0.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transition-colors"
          style={{ height: thumb.height, top: thumb.top }}
        />
      )}
    </div>
  );
}
