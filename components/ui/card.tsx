export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl",
        "border border-gray-200/80",
        "bg-white",
        "p-6",
        "shadow-[0_2px_12px_rgba(15,23,42,0.04)]",
        "transition-all duration-200",
        "hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}