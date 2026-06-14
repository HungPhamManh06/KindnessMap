import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { Info, CheckCircle2, AlertTriangle, Trophy, X } from 'lucide-react';

export const NotificationToast = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />;
      case 'award':
        return <Trophy className="w-6 h-6 text-yellow-500 shrink-0 animate-bounce" />;
      default:
        return <Info className="w-6 h-6 text-blue-500 shrink-0" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/95 text-emerald-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50/95 text-amber-900';
      case 'award':
        return 'border-yellow-300 bg-yellow-50/95 text-yellow-900 shadow-yellow-100';
      default:
        return 'border-blue-200 bg-blue-50/95 text-blue-900';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in ${getBg(toast.type)}`}
        >
          {getIcon(toast.type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-snug">{toast.title}</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
