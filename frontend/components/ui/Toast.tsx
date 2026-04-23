"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastAPI {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
  warning: (msg: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

let uid = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++uid;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const api: ToastAPI = {
    success: (m) => push("success", m),
    error:   (m) => push("error",   m),
    info:    (m) => push("info",    m),
    warning: (m) => push("warning", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={() => setItems((p) => p.filter((x) => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const palette: Record<ToastKind, { icon: ReactNode; ring: string; bar: string }> = {
    success: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-300" />, ring: "border-emerald-500/40", bar: "bg-emerald-400" },
    error:   { icon: <AlertCircle  className="w-5 h-5 text-rose-300" />,   ring: "border-rose-500/40",   bar: "bg-rose-400" },
    info:    { icon: <Info         className="w-5 h-5 text-sky-300" />,   ring: "border-sky-500/40",    bar: "bg-sky-400" },
    warning: { icon: <AlertTriangle className="w-5 h-5 text-amber-300" />,ring: "border-amber-500/40",  bar: "bg-amber-400" },
  };
  const p = palette[item.kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "pointer-events-auto relative w-80 rounded-lg border bg-bg-raised/95 backdrop-blur-xl px-4 py-3 shadow-md",
        p.ring
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{p.icon}</div>
        <p className="flex-1 text-sm text-gray-100 leading-snug">{item.message}</p>
        <button aria-label="Dismiss" onClick={onDismiss} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: 0 }}
        transition={{ duration: 4.2, ease: "linear" }}
        className={cn("absolute left-0 bottom-0 h-0.5 rounded-b-lg", p.bar)}
      />
    </motion.div>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
