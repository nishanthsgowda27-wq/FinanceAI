interface ProgressProps {
  value: number;
  className?: string;
}

export default function Progress({
  value,
  className = "",
}: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`h-3 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}