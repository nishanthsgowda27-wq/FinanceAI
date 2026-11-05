import {
  Lightbulb,
  CheckCircle,
} from "lucide-react";

import Card from "@/components/ui/card";

const advice = [
  "Compare interest rates from multiple lenders.",
  "Choose a tenure that keeps EMI manageable.",
  "Avoid taking a loan larger than your repayment capacity.",
  "Check processing fees and other loan charges.",
  "Maintain an emergency fund before taking a major loan.",
];

export default function LoanAdvice() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600">
          <Lightbulb size={22} />
        </div>

        <div>
          <h2 className="font-bold">
            Loan Suggestions
          </h2>

          <p className="text-sm text-gray-500">
            General guidance based on your loan details
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {advice.map((item) => (
          <div key={item} className="flex gap-3">
            <CheckCircle
              size={18}
              className="mt-0.5 shrink-0 text-green-600"
            />

            <p className="text-sm leading-6 text-gray-600">
              {item}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
