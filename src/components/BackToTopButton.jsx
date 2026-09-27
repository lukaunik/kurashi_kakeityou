import React, { useState, useEffect, useCallback } from 'react';

const SHOW_THRESHOLD = 400;

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > SHOW_THRESHOLD);
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="ページの先頭へ戻る"
      tabIndex={visible ? 0 : -1}
      className={`fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full
        bg-sumi-700 text-white shadow-lg shadow-ink-900/20 transition-all duration-300 ease-out
        hover:bg-sumi-600 active:scale-95
        bottom-[calc(1.25rem+env(safe-area-inset-bottom))]
        ${visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3'}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
