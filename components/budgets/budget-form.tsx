"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";

export default function BudgetForm() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Budget created successfully!");
    }, 700);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <Select
        label="Expense Category"
        name="category"
        defaultValue=""
        required
      >
        <option value="" disabled>
          Select category
        </option>

        <option value="food">Food</option>
        <option value="transport">Transport</option>
        <option value="shopping">Shopping</option>
        <option value="bills">Bills & Utilities</option>
        <option value="entertainment">
          Entertainment
        </option>
        <option value="health">Health</option>
        <option value="education">Education</option>
        <option value="other">Other</option>
      </Select>

      <Input
        label="Budget Limit"
        name="limit"
        type="number"
        min="0"
        placeholder="Example: 10000"
        required
      />

      <Select
        label="Budget Period"
        name="period"
        defaultValue="monthly"
        required
      >
        <option value="weekly">
          Weekly
        </option>

        <option value="monthly">
          Monthly
        </option>

        <option value="yearly">
          Yearly
        </option>
      </Select>

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
            Creating Budget...
          </>
        ) : (
          <>
            <Plus size={18} />
            Create Budget
          </>
        )}
      </Button>
    </form>
  );
}