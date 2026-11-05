import {
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import Card from "@/components/ui/card";
import Progress from "@/components/ui/progress";

export default function LoanAffordability() {
  const score = 72;

  return (
    <Card>
      <h2 className="text-xl font-bold">
        Loan Affordability
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Based on your income and estimated EMI.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-4xl font-bold text-green-600">
            {score}
            <span className="text-lg text-gray-400">
              /100
            </span>
          </p>

          <p className="mt-1 text-sm text-green-600">
            Affordable
          </p>
        </div>

        <CheckCircle
          size={35}
          className="text-green-600"
        />
      </div>

      <div className="mt-5">
        <Progress value={score} />
      </div>

      <div className="mt-5 rounded-xl bg-yellow-50 p-4">
        <div className="flex gap-2">
          <AlertTriangle
            size={18}
            className="mt-0.5 text-yellow-600"
          />

          <p className="text-sm leading-6 text-gray-600">
            Try to keep your total monthly loan
            obligations within a manageable percentage
            of your income.
          </p>
        </div>
      </div>
    </Card>
  );
}
