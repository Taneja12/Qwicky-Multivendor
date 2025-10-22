"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-emerald-600 text-white hover:bg-emerald-700": variant === "default",
            "border border-emerald-600 bg-transparent text-emerald-600 hover:bg-emerald-50": variant === "outline",
            "hover:text-emerald-600 hover:underline": variant === "link",
            "hover:bg-emerald-50": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3": size === "sm",
            "h-12 px-8": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };