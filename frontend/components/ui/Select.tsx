"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full h-10 px-3 rounded-lg bg-white/[0.04] text-gray-100",
          "border border-border-subtle transition-all",
          "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    );
  }
);
