import { MoreVertical, PiggyBank } from "lucide-react";

import Card from "@/components/ui/card";
import SavingsProgress from "./savings-progress";

interface SavingsCardProps {
  name: string;
  saved: number;
  target: number;
  deadline: string;
}

export default function SavingsCard({
  name,
  saved,
  target,
  deadline,
}: SavingsCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <PiggyBank size={22} />
          </div>

          <div>
            <h3 className="font-bold">{name}</h3>
            <p className="text-sm text-gray-500">
              Target: {deadline}
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

      <SavingsProgress
        saved={saved}
        target={target}
      />
    </Card>
  );
}