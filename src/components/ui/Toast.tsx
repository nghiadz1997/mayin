"use client";

import React, { createContext, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (msg) => addToast(msg, "success"),
        error: (msg) => addToast(msg, "error"),
        info: (msg) => addToast(msg, "info"),
      }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((t) => {
          const styles = {
            success: "bg-emerald-600 text-white shadow-emerald-600/30",
            error: "bg-rose-600 text-white shadow-rose-600/30",
            info: "bg-blue-600 text-white shadow-blue-600/30",
          };
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
            error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
            info: <Info className="w-5 h-5 flex-shrink-0" />,
          };
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all animate-in slide-in-from-bottom-2 duration-200 ${styles[t.type]}`}
            >
              {icons[t.type]}
              <span className="text-xs font-medium leading-relaxed">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md hover:bg-white/20 ml-auto flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
