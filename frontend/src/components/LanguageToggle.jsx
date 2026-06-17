import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageToggle = ({ mobile = false, dropdown = false }) => {
  const { language, toggleLanguage } = useLanguage();
  const isVietnamese = language === 'vi';

  const baseClassName = dropdown
    ? 'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all'
    : mobile
      ? 'w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all'
      : 'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm';

  const iconWrapClass = isVietnamese
    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-brand-green'
    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isVietnamese ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
      className={baseClassName}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconWrapClass}`}>
          <Languages className="w-4 h-4" />
        </div>
        <div className="flex flex-col items-start text-left leading-none min-w-0">
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            {isVietnamese ? 'Tiếng Việt' : 'English'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {isVietnamese ? 'Chuyển toàn bộ giao diện' : 'Switch entire interface'}
          </span>
        </div>
      </div>

      {mobile && !dropdown && (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isVietnamese ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
          {isVietnamese ? 'VI' : 'EN'}
        </span>
      )}
    </button>
  );
};
