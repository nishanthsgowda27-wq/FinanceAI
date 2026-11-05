import { MoreVertical, Target } from "lucide-react";

import Card from "@/components/ui/card";
import BudgetProgress from "./budget-progress";

interface BudgetCardProps {
  category: string;
  spent: number;
  limit: number;
  period: string;
}

export default function BudgetCard({
  category,
  spent,
  limit,
  period,
}: BudgetCardProps) {
  const percentage =
    limit > 0 ? (spent / limit) * 100 : 0;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Target size={21} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">
              {category}
            </h3>

            <p className="text-sm text-gray-500">
              {period}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <MoreVertical size={19} />
        </button>
      </div>

      <BudgetProgress
        spent={spent}
        limit={limit}
      />

      {percentage >= 90 && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          ⚠️ You are close to reaching this budget limit.
        </div>
      )}
    </Card>
  );
}