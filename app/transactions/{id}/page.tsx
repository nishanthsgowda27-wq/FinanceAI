import Link from "next/link";

export default async function TransactionDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <Link href="/transactions" className="text-blue-600">
          ← Transactions
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Transaction Details
        </h1>

        <div className="mt-8 space-y-4">
          <p>
            <strong>Transaction ID:</strong> {id}
          </p>

          <p>
            <strong>Description:</strong> Groceries
          </p>

          <p>
            <strong>Category:</strong> Food
          </p>

          <p>
            <strong>Amount:</strong> ₹2,500
          </p>
        </div>
      </div>
    </main>
  );
}