import {
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={props.id || props.name}
          className="block text-sm font-semibold text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        className={[
          "w-full rounded-xl",
          "border border-gray-200",
          "bg-white",
          "px-4 py-3",
          "text-sm text-gray-900",
          "outline-none",
          "transition-all duration-200",
          "placeholder:text-gray-400",
          "hover:border-gray-300",
          "focus:border-blue-500",
          "focus:ring-4 focus:ring-blue-500/10",
          error ? "border-red-400" : "",
          className,
        ].join(" ")}
      />

      {error && (
        <p className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}