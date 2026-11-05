"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import CategorySelector from "./category-selector";

export default function TransactionForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("expense");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const newTransaction = {
      id: Date.now().toString(),
      name: String(formData.get("description")),
      category: String(formData.get("category") || "Other"),
      amount: Number(formData.get("amount")),
      type: String(formData.get("type")),
      account: String(formData.get("account")),
      date: String(formData.get("date")),
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTransaction, description: newTransaction.name, paymentMethod: newTransaction.account }),
      });
      if (!response.ok) throw new Error("Unable to save transaction");
      setLoading(false);
      router.push("/transactions");
    } catch {
      setLoading(false);
      alert("Unable to save transaction. Please sign in and try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <Select
        label="Transaction Type"
        name="type"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </Select>

      <Input
        label="Description"
        name="description"
        placeholder="Example: Grocery shopping"
        required
      />

      <Input
        label="Amount"
        name="amount"
        type="number"
        min="1"
        placeholder="Enter amount"
        required
      />

      <CategorySelector />

      <Select
        label="Account"
        name="account"
        defaultValue=""
        required
      >
        <option value="" disabled>
          Select account
        </option>

        <option value="hdfc">HDFC Savings</option>
        <option value="sbi">SBI Account</option>
        <option value="cash">Cash</option>
      </Select>

      <Input
        label="Date"
        name="date"
        type="date"
        required
      />

      <Button
        type="submit"
        className="flex w-full items-center justify-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />
            Saving...
          </>
        ) : (
          <>
            <Plus size={18} />
            Add Transaction
          </>
        )}
      </Button>
    </form>
  );
}