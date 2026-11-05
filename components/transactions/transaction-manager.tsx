"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Transaction } from "@/lib/finance/financeData";
import { CATEGORY_OPTIONS, getCategoryBadgeStyle, getCategoryColor } from "@/lib/finance/category-colors";

const expenseCategories = CATEGORY_OPTIONS;
const paymentMethods = ["Bank account", "Credit card", "Debit card", "Cash", "UPI", "Other"];
const today = () => new Date().toISOString().split("T")[0];
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

type FormState = Omit<Transaction, "id" | "type">;
const emptyForm: FormState = { title: "", amount: 0, category: "", date: today(), paymentMethod: "", notes: "" };

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const categories = expenseCategories;

  const load = async () => {
    try {
      console.info("[EXPENSE CLIENT DEBUG] request started");
      const response = await fetch("/api/expenses", { cache: "no-store", credentials: "include" });
      const data: { success?: boolean; expenses?: Transaction[]; message?: string } = await response.json().catch(() => ({}));
      console.info("[EXPENSE CLIENT DEBUG] response status", response.status);
      console.info("[EXPENSE CLIENT DEBUG] response JSON message", data.message ?? "");
      if (response.status === 401) throw new Error("Please sign in again to manage expenses.");
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load expenses from the database.");
      setTransactions(data.expenses ?? []);
    } catch (loadError) {
      console.error("EXPENSES LOAD ERROR", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load transactions.");
    }
  };
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    window.addEventListener("financeDataUpdated", load);
    window.addEventListener("storage", load);
    return () => { window.clearTimeout(initialLoad); window.removeEventListener("financeDataUpdated", load); window.removeEventListener("storage", load); };
  }, []);

  const filtered = useMemo(() => transactions.filter((item) => {
    const matchesQuery = `${item.title} ${item.category} ${item.notes ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (categoryFilter === "all" || item.category === categoryFilter) && (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate);
  }).sort((a, b) => b.date.localeCompare(a.date)), [transactions, query, categoryFilter, startDate, endDate]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || form.amount <= 0 || !form.category || !form.date) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
      const response = await fetch(endpoint, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...form, paymentMethod: form.paymentMethod || null, notes: form.notes || null }) });
      const data: { success?: boolean; message?: string } = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Please sign in again to manage expenses.");
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save expense to the database.");
      await load();
      window.dispatchEvent(new Event("financeDataUpdated"));
      setForm({ ...emptyForm, date: today() });
      setEditingId(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save transaction.");
    } finally {
      setLoading(false);
    }
  }
  function edit(item: Transaction) { setEditingId(item.id); setForm({ title: item.title, amount: item.amount, category: item.category, date: item.date, paymentMethod: item.paymentMethod ?? "", notes: item.notes ?? "" }); }

  async function remove(id: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE", credentials: "include" });
      const data: { success?: boolean; message?: string } = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Please sign in again to manage expenses.");
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to delete expense from the database.");
      await load();
      window.dispatchEvent(new Event("financeDataUpdated"));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to delete transaction.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="space-y-6">
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Transactions</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{editingId ? "Edit transaction" : "Add transaction"}</h2></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm, date: today() }); }} aria-label="Cancel editing"><X size={18} /></button>}</div>
        <div className="mt-4 space-y-4"><Field label="Description"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly salary" /></Field><Field label="Amount"><input required min="0.01" step="0.01" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" /></Field><Field label="Category"><div className="space-y-2"><select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>{form.category && <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" style={getCategoryBadgeStyle(form.category)}>{form.category}</span>}</div></Field><Field label="Date"><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Payment method"><select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}><option value="">Select method</option>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></Field><Field label="Notes (optional)"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field></div>
        <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={18} />{loading ? "Saving..." : editingId ? "Save changes" : "Add transaction"}</button>
      </form>
      <section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900">All transactions</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} of {transactions.length} records</p></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:w-60" /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="all">All categories</option>{[...new Set(transactions.map((item) => item.category))].sort().map((category) => <option key={category}>{category}</option>)}</select><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label="Start date" /><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label="End date" /></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Type</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3" /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="px-3 py-4 text-slate-500">{item.date}</td><td className="px-3 py-4 font-semibold text-slate-800">{item.title}</td><td className="px-3 py-4"><span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold" style={getCategoryBadgeStyle(item.category)}>{item.category}</span></td><td className={`px-3 py-4 font-semibold ${item.type === "income" ? "text-emerald-600" : "text-red-600"}`}>{item.type}</td><td className="px-3 py-4 text-right font-bold">{item.type === "income" ? "+" : "-"}{money(item.amount)}</td><td className="px-3 py-4"><div className="flex justify-end gap-2"><button disabled={loading} onClick={() => edit(item)} aria-label={`Edit ${item.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button><button disabled={loading} onClick={() => void remove(item.id)} aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="py-12 text-center text-sm text-slate-500">No transactions match these filters.</p>}</div>
      </section>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}<div className="mt-1 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:px-3 [&>input]:py-2 [&>input]:outline-none [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:px-3 [&>select]:py-2 [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-slate-200 [&>textarea]:px-3 [&>textarea]:py-2">{children}</div></label>; }
