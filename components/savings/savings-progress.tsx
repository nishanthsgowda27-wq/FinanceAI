import Progress from "@/components/ui/progress";

interface SavingsProgressProps {
  saved: number;
  target: number;
}

export default function SavingsProgress({
  saved,
  target,
}: SavingsProgressProps) {
  const percentage =
    target > 0 ? Math.min((saved / target) * 100, 100) : 0;

  const remaining = Math.max(target - saved, 0);

  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-500">
          ₹{saved.toLocaleString("en-IN")} saved
        </span>

        <span className="font-medium">
          ₹{target.toLocaleString("en-IN")}
        </span>
      </div>

      <Progress value={percentage} />

      <div className="mt-2 flex justify-between text-xs">
        <span className="text-gray-500">
          {Math.round(percentage)}% complete
        </span>

        <span className="text-blue-600">
          ₹{remaining.toLocaleString("en-IN")} remaining
        </span>
      </div>
    </div>
  );
}