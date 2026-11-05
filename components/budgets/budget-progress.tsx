import Progress from "@/components/ui/progress";

interface BudgetProgressProps {
  spent: number;
  limit: number;
}

export default function BudgetProgress({
  spent,
  limit,
}: BudgetProgressProps) {
  const percentage =
    limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  const remaining = Math.max(limit - spent, 0);

  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-500">
          ₹{spent.toLocaleString("en-IN")} spent
        </span>

        <span className="font-medium text-gray-700">
          ₹{limit.toLocaleString("en-IN")}
        </span>
      </div>

      <Progress value={percentage} />

      <div className="mt-2 flex justify-between text-xs">
        <span className="text-gray-500">
          {Math.round(percentage)}% used
        </span>

        <span
          className={
            percentage >= 90
              ? "font-semibold text-red-600"
              : "text-green-600"
          }
        >
          ₹{remaining.toLocaleString("en-IN")} remaining
        </span>
      </div>
    </div>
  );
}