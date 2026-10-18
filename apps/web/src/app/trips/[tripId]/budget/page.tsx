"use client";

import { FormEvent, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "../_components/icons";
import { useWorkspace } from "../workspace-context";

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function BudgetPage() {
  const { expenses, members, addExpense, removeExpense } = useWorkspace();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("Uny");
  const [category, setCategory] = useState("Food");
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const activeMembers = members.filter((member) => member.status === "Active");

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    addExpense({ title: title.trim(), amount: parsedAmount, paidBy, category });
    setTitle("");
    setAmount("");
  }

  return (
    <div className="tmw-page">
      <header className="tmw-page-header"><div><p className="tmw-eyebrow">SHARED BUDGET</p><h1>Keep spending clear.</h1><p>Record group costs and see the simple split.</p></div></header>
      <section className="tmw-budget-summary">
        <div><span>TRIP TOTAL</span><strong>{money.format(total)}</strong><small>Across {expenses.length} expenses</small></div>
        <div><span>PER PERSON</span><strong>{money.format(activeMembers.length ? total / activeMembers.length : 0)}</strong><small>Equal split · {activeMembers.length} travellers</small></div>
        <div className="tmw-budget-accent"><span>ESTIMATED BUDGET</span><strong>{money.format(900)}</strong><small>{money.format(Math.max(0, 900 - total))} remaining</small></div>
      </section>
      <div className="tmw-content-grid">
        <section className="tmw-panel">
          <div className="tmw-panel-heading"><div><p>ALL COSTS</p><h2>Expenses</h2></div></div>
          <div className="tmw-expense-list">
            {expenses.map((expense) => <article key={expense.id}><span className="tmw-expense-mark">{expense.category.slice(0, 1)}</span><div><strong>{expense.title}</strong><small>{expense.paidBy} paid · {expense.category}</small></div><b>{money.format(expense.amount)}</b><button className="tmw-icon-button" onClick={() => removeExpense(expense.id)} aria-label={`Remove ${expense.title}`}><TrashIcon /></button></article>)}
          </div>
        </section>
        <aside className="tmw-panel tmw-form-panel">
          <p className="tmw-panel-label">NEW COST</p><h2>Add expense</h2>
          <form className="tmw-form" onSubmit={submitExpense}>
            <label>Description<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Saturday dinner" required /></label>
            <div className="tmw-form-row"><label>Amount (CAD)<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label><label>Paid by<select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>{activeMembers.map((member) => <option key={member.id}>{member.name.split(" ")[0]}</option>)}</select></label></div>
            <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Food</option><option>Stay</option><option>Transport</option><option>Activity</option><option>Other</option></select></label>
            <button className="tmw-primary-button" type="submit"><PlusIcon /> Add expense</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
