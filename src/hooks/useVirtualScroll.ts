import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>({
  items,
  itemHeight = 52,
  overscan = 8,
}: {
  items: T[];
  itemHeight?: number;
  overscan?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const itemCount = items.length;

  // Handle scroll events with requestAnimationFrame for 60fps performance
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        if (el) {
          setScrollTop(el.scrollTop);
        }
        rafId = null;
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Measure container height with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    ro.observe(el);
    setContainerHeight(el.clientHeight || 600);

    return () => ro.disconnect();
  }, []);

  const totalHeight = itemCount * itemHeight;

  const { startIndex, endIndex, visibleItems, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(itemCount, start + visibleCount + overscan * 2);

    const slice = items.slice(start, end).map((item, i) => ({
      item,
      index: start + i,
    }));

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: slice,
      offsetY: start * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan, items]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const el = containerRef.current;
      if (!el) return;
      const targetTop = Math.max(0, index * itemHeight);
      el.scrollTo({ top: targetTop, behavior });
    },
    [itemHeight]
  );

  return {
    containerRef,
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    scrollToIndex,
  };
}
