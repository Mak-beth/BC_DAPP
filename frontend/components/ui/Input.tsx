"use client";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, mono, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 px-3 rounded-lg bg-white/[0.04] text-gray-100 placeholder-gray-500",
        "border transition-all",
        "border-border-subtle",
        "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 focus:bg-white/[0.06]",
        error && "border-rose-500/60 focus:border-rose-400 focus:ring-rose-400/30",
        mono && "font-mono",
        className
      )}
      {...rest}
    />
  );
});
