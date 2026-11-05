import Card from "@/components/ui/card";

const breakdown = [
  {
    label: "Principal Amount",
    value: "?5,00,000",
  },
  {
    label: "Total Interest",
    value: "?1,27,000",
  },
  {
    label: "Total Repayment",
    value: "?6,27,000",
  },
  {
    label: "Loan Tenure",
    value: "5 Years",
  },
];

export default function EmiBreakdown() {
  return (
    <Card>
      <h2 className="text-xl font-bold">
        EMI Breakdown
      </h2>

      <div className="mt-6 space-y-4">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
          >
            <span className="text-sm text-gray-500">
              {item.label}
            </span>

            <span className="font-semibold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
