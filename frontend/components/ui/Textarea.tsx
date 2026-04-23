"use client";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[100px] px-3 py-2 rounded-lg bg-white/[0.04] text-gray-100 placeholder-gray-500",
          "border border-border-subtle transition-all",
          "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 focus:bg-white/[0.06]",
          className
        )}
        {...rest}
      />
    );
  }
);
