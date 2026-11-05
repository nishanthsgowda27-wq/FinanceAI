import Card from "@/components/ui/card";

const options = [
  {
    tenure: "3 Years",
    emi: "?16,030",
    interest: "?77,080",
  },
  {
    tenure: "5 Years",
    emi: "?10,450",
    interest: "?1,27,000",
  },
  {
    tenure: "7 Years",
    emi: "?8,190",
    interest: "?1,88,000",
  },
];

export default function LoanComparison() {
  return (
    <Card>
      <h2 className="text-xl font-bold">
        Loan Tenure Comparison
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Compare EMI and total interest for different
        tenures.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[500px] text-left">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-3 text-sm text-gray-500">
                Tenure
              </th>
              <th className="px-3 py-3 text-sm text-gray-500">
                Monthly EMI
              </th>
              <th className="px-3 py-3 text-sm text-gray-500">
                Total Interest
              </th>
            </tr>
          </thead>

          <tbody>
            {options.map((option) => (
              <tr
                key={option.tenure}
                className="border-b last:border-0"
              >
                <td className="px-3 py-4 font-medium">
                  {option.tenure}
                </td>
                <td className="px-3 py-4 font-semibold">
                  {option.emi}
                </td>
                <td className="px-3 py-4 text-gray-600">
                  {option.interest}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
