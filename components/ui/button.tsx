"use client";

import {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline:
      "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center",
        "rounded-xl",
        "px-4 py-2.5",
        "text-sm font-semibold",
        "transition-all duration-200",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}