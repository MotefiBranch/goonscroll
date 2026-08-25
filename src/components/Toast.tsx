import React from 'react';
import { X, Undo2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none max-w-[90vw] sm:max-w-md w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto w-full bg-zinc-900/95 border border-white/15 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between space-x-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="truncate flex-1 font-medium">{t.text}</span>

          {t.onAction && t.actionText && (
            <button
              onClick={() => {
                t.onAction?.();
                removeToast(t.id);
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors active:scale-95 shadow"
            >
              <Undo2 size={13} />
              <span>{t.actionText}</span>
            </button>
          )}

          <button
            onClick={() => removeToast(t.id)}
            className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
