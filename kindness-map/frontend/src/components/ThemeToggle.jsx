import React from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ mobile = false, dropdown = false, compact = false }) => {
  const { isDark, toggleTheme } = useTheme();

  const iconWrapClass = isDark
    ? 'bg-amber-100 text-amber-600'
    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100';

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        title={isDark ? 'Bật light mode' : 'Bật dark mode'}
        className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center"
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconWrapClass}`}>
          {isDark ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
        </div>
      </button>
    );
  }

  const baseClassName = dropdown
    ? 'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all'
    : mobile
      ? 'w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all'
      : 'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm';

  const showPill = mobile && !dropdown;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Bật light mode' : 'Bật dark mode'}
      className={baseClassName}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconWrapClass}`}>
          {isDark ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
        </div>
        <div className="flex flex-col items-start text-left leading-none min-w-0">
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            {isDark ? 'Light mode' : 'Dark mode'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {isDark ? 'Tông sáng dịu mắt ban ngày' : 'Tông tối dễ nhìn ban đêm'}
          </span>
        </div>
      </div>

      {showPill && (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isDark ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
          {isDark ? 'ON' : 'OFF'}
        </span>
      )}
    </button>
  );
};
