import { CreditCard, IndianRupee } from "lucide-react";

import Card from "@/components/ui/card";

export default function LoanResult() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
          <CreditCard size={22} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Estimated Monthly EMI
          </p>

          <h2 className="text-3xl font-bold">
            ?10,450
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Loan Amount
          </p>
          <p className="mt-1 font-bold">
            ?5,00,000
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Interest Rate
          </p>
          <p className="mt-1 font-bold">
            9.5%
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-4">
        <IndianRupee size={18} className="text-green-600" />

        <p className="text-sm text-gray-600">
          Estimated EMI based on the information provided.
        </p>
      </div>
    </Card>
  );
}
