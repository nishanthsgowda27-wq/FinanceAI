import {
  CreditCard,
  MoreVertical,
} from "lucide-react";

import Card from "@/components/ui/card";

interface AccountCardProps {
  name: string;
  type: string;
  balance: number;
  accountNumber: string;
}

export default function AccountCard({
  name,
  type,
  balance,
  accountNumber,
}: AccountCardProps) {
  return (
    <Card className="relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <CreditCard size={22} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">
              {name}
            </h3>

            <p className="text-sm text-gray-500">
              {type}
            </p>
          </div>
        </div>

        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="mt-7">
        <p className="text-sm text-gray-500">
          Available Balance
        </p>

        <p className="mt-1 text-2xl font-bold">
          ₹{balance.toLocaleString("en-IN")}
        </p>

        <p className="mt-2 text-sm text-gray-400">
          {accountNumber}
        </p>
      </div>
    </Card>
  );
}