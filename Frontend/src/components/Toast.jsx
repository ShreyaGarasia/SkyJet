import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div 
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 scale-100 ${bgColors[toast.type] || bgColors.info}`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      {icons[toast.type] || icons.info}
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 cursor-pointer">
        <X className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(1rem) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
