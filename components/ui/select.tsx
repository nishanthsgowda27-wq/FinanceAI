import {
  SelectHTMLAttributes,
  ReactNode,
} from "react";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export default function Select({
  label,
  children,
  className = "",
  ...props
}: SelectProps) {
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

      <select
        {...props}
        className={[
          "w-full rounded-xl",
          "border border-gray-200",
          "bg-white",
          "px-4 py-3",
          "text-sm text-gray-900",
          "outline-none",
          "transition-all",
          "hover:border-gray-300",
          "focus:border-blue-500",
          "focus:ring-4 focus:ring-blue-500/10",
          className,
        ].join(" ")}
      >
        {children}
      </select>
    </div>
  );
}