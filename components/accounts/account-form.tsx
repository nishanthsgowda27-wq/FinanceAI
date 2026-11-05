"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";

export default function AccountForm() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Account added successfully!");
    }, 700);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <Input
        label="Account Name"
        name="accountName"
        placeholder="Example: HDFC Savings"
        required
      />

      <Select
        label="Account Type"
        name="accountType"
        defaultValue=""
        required
      >
        <option value="" disabled>
          Select account type
        </option>

        <option value="savings">
          Savings Account
        </option>

        <option value="current">
          Current Account
        </option>

        <option value="bank">
          Bank Account
        </option>

        <option value="cash">
          Cash
        </option>

        <option value="credit-card">
          Credit Card
        </option>
      </Select>

      <Input
        label="Current Balance"
        name="balance"
        type="number"
        min="0"
        placeholder="Enter current balance"
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
            Adding Account...
          </>
        ) : (
          <>
            <Plus size={18} />
            Add Account
          </>
        )}
      </Button>
    </form>
  );
}