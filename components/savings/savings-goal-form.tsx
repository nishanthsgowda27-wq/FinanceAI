"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function SavingsGoalForm() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Savings goal created successfully!");
    }, 700);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <Input
        label="Goal Name"
        name="goalName"
        placeholder="Example: Emergency Fund"
        required
      />

      <Input
        label="Target Amount"
        name="targetAmount"
        type="number"
        min="0"
        placeholder="Example: 100000"
        required
      />

      <Input
        label="Initial Amount"
        name="initialAmount"
        type="number"
        min="0"
        placeholder="Example: 10000"
        required
      />

      <Input
        label="Target Date"
        name="targetDate"
        type="date"
        required
      />

      <Button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Creating Goal...
          </>
        ) : (
          <>
            <Plus size={18} />
            Create Savings Goal
          </>
        )}
      </Button>
    </form>
  );
}