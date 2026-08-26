"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type MouseEventHandler,
} from "react";
import { motion, useInView } from "motion/react";

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter: () => void;
  onClick: MouseEventHandler<HTMLDivElement>;
  /** true = scroll-reveal (fires when scrolled into view, for long scrollable lists); false = always animate in on mount (for short, fully-visible lists). */
  viewportTrigger?: boolean;
}

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick, viewportTrigger = true }: AnimatedItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });
  const isVisible = viewportTrigger ? inView : true;

  return (
    <motion.div
      ref={ref}
      data-index={index}
      className="animated-list-item"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
};

interface AnimatedListProps<T> {
  items?: T[];
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  getKey?: (item: T, index: number) => string | number;
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  /** When true, the list grows to fit its content instead of filling a fixed-height parent (no internal scroll). */
  autoHeight?: boolean;
}

const AnimatedList = <T,>({
  items = [],
  renderItem,
  getKey,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = "",
  itemClassName = "",
  displayScrollbar = true,
  initialSelectedIndex = -1,
  autoHeight = false,
}: AnimatedListProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      onItemSelect?.(item, index);
    },
    [onItemSelect]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  }, []);

  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onItemSelect?.(items[selectedIndex], selectedIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: "smooth" });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: "smooth",
        });
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`scroll-list-container ${autoHeight ? "auto-height" : ""} ${className}`}>
      <div
        ref={listRef}
        className={`scroll-list ${!displayScrollbar ? "no-scrollbar" : ""}`}
        onScroll={handleScroll}
      >
        {items.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <AnimatedItem
              key={getKey ? getKey(item, index) : index}
              delay={autoHeight ? index * 0.08 : 0.05}
              index={index}
              viewportTrigger={!autoHeight}
              onMouseEnter={() => handleItemMouseEnter(index)}
              onClick={() => handleItemClick(item, index)}
            >
              {renderItem ? (
                renderItem(item, index, isSelected)
              ) : (
                <div className={`item ${isSelected ? "selected" : ""} ${itemClassName}`}>
                  <p className="item-text">{String(item)}</p>
                </div>
              )}
            </AnimatedItem>
          );
        })}
      </div>
      {showGradients && (
        <>
          <div className="top-gradient" style={{ opacity: topGradientOpacity }} />
          <div className="bottom-gradient" style={{ opacity: bottomGradientOpacity }} />
        </>
      )}

      <style jsx global>{`
        .scroll-list-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .scroll-list-container.auto-height {
          height: auto;
        }

        .scroll-list {
          height: 100%;
          overflow-y: auto;
          padding: 4px;
        }

        .scroll-list-container.auto-height .scroll-list {
          height: auto;
          overflow: visible;
        }

        .animated-list-item {
          cursor: pointer;
        }

        .animated-list-item:not(:last-child) {
          margin-bottom: 0.75rem;
        }

        .scroll-list::-webkit-scrollbar {
          width: 8px;
        }

        .scroll-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .scroll-list::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 4px;
        }

        .dark .scroll-list::-webkit-scrollbar-thumb {
          background: #374151;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .item {
          padding: 16px;
          background-color: #f7f8fa;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 1rem;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .item.selected {
          background-color: #eaf1ff;
          border-color: #2c79ff;
        }

        .dark .item {
          background-color: #1f2937;
          border-color: #374151;
        }

        .dark .item.selected {
          background-color: rgba(44, 121, 255, 0.15);
          border-color: #2c79ff;
        }

        .item-text {
          color: #1f2937;
          margin: 0;
        }

        .dark .item-text {
          color: #f3f4f6;
        }

        .top-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: linear-gradient(to bottom, #ffffff, transparent);
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .dark .top-gradient {
          background: linear-gradient(to bottom, #111827, transparent);
        }

        .bottom-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to top, #ffffff, transparent);
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .dark .bottom-gradient {
          background: linear-gradient(to top, #111827, transparent);
        }
      `}</style>
    </div>
  );
};

export default AnimatedList;
