import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Tertiary = Record<string, number>;
type Secondary = Record<string, { spent: number; children: Tertiary }>;
type Primary  = Record<string, { budget: number; spent: number; children: Secondary }>;
type Level = "primary" | "secondary" | "tertiary";
interface DrillState { level: Level; primaryKey?: string; secondaryKey?: string; }

const DATA: Primary = {
  Food: {
    budget: 600, spent: 420,
    children: {
      Groceries:   { spent: 200, children: { Produce: 80, "Packaged Goods": 60, Beverages: 60 } },
      Restaurants: { spent: 220, children: { "Fast Food": 150, "Casual Dining": 40, "Fine Dining": 30 } },
    },
  },
  Housing: {
    budget: 1200, spent: 180,
    children: {
      Rent: { spent: 1100, children: { Base: 1100 } },
      Utilities: { spent: 80, children: { Electric: 45, Water: 20, Gas: 15 } },
    },
  },
  Transportation: {
    budget: 300, spent: 150,
    children: {
      Fuel: { spent: 120, children: { Regular: 90, Premium: 30 } },
      Parking: { spent: 30, children: { Street: 10, Garage: 20 } },
    },
  },
  Entertainment: {
    budget: 200, spent: 90,
    children: {
      Streaming: { spent: 45, children: { Netflix: 20, Hulu: 15, Spotify: 10 } },
      Events: { spent: 45, children: { Movies: 20, "Live Show": 25 } },
    },
  },
};

const COLORS = ["#2563eb","#16a34a","#f59e0b","#ef4444","#8b5cf6","#10b981","#f97316","#06b6d4","#e11d48"];
const currency = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function buildPrimarySeries(data: Primary) {
  return Object.entries(data).map(([name, v]) => ({ name, value: v.spent }));
}
function buildSecondarySeries(data: Primary, primaryKey: string) {
  const node = data[primaryKey]; if (!node) return [];
  return Object.entries(node.children).map(([name, v]) => ({ name, value: v.spent }));
}
function buildTertiarySeries(data: Primary, primaryKey: string, secondaryKey: string) {
  const node = data[primaryKey]?.children?.[secondaryKey]; if (!node) return [];
  return Object.entries(node.children).map(([name, v]) => ({ name, value: v }));
}

export default function FinTrackDashboard() {
  const [drill, setDrill] = useState<DrillState>({ level: "primary" });
  const [search, setSearch] = useState("");

  const bars = useMemo(() =>
    Object.entries(DATA).map(([k, v]) => ({
      key: k, budget: v.budget, spent: v.spent,
      pct: Math.min(100, (v.spent / v.budget) * 100),
      remaining: Math.max(0, v.budget - v.spent),
    })), []);

  const pieData = useMemo(() => {
    if (drill.level === "primary") return buildPrimarySeries(DATA);
    if (drill.level === "secondary" && drill.primaryKey) return buildSecondarySeries(DATA, drill.primaryKey);
    if (drill.level === "tertiary" && drill.primaryKey && drill.secondaryKey) return buildTertiarySeries(DATA, drill.primaryKey, drill.secondaryKey);
    return [];
  }, [drill]);

  const crumb = [
    { label: "Primary", onClick: () => setDrill({ level: "primary" }) },
    ...(drill.primaryKey ? [{ label: drill.primaryKey, onClick: () => setDrill({ level: "secondary", primaryKey: drill.primaryKey }) }] : []),
    ...(drill.secondaryKey && drill.primaryKey ? [{ label: drill.secondaryKey, onClick: () => setDrill({ level: "tertiary", primaryKey: drill.primaryKey, secondaryKey: drill.secondaryKey }) }] : []),
  ];

  const tx = [
    { id: 1, merchant: "Whole Foods", amount: 54.23, tag: "Food>Groceries>Produce" },
    { id: 2, merchant: "Shell", amount: 32.10, tag: "Transportation>Fuel>Regular" },
    { id: 3, merchant: "AMC Theatres", amount: 24.00, tag: "Entertainment>Events>Movies" },
    { id: 4, merchant: "Chipotle", amount: 11.80, tag: "Food>Restaurants>Fast Food" },
  ];
  const filteredTx = tx.filter(t => {
    const q = search.toLowerCase();
    return !q || t.merchant.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q);
  });

  function onSliceClick(e: any) {
    const name = e?.name as string;
    if (drill.level === "primary") setDrill({ level: "secondary", primaryKey: name });
    else if (drill.level === "secondary" && drill.primaryKey) setDrill({ level: "tertiary", primaryKey: drill.primaryKey, secondaryKey: name });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top bar */}
      <div className="sticky top-0 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <div className="font-bold text-xl">ClearDollar</div>
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">Connect Bank</button>
            <button className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">Import CSV</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* budget bars */}
        <div className="bg-white border rounded-2xl p-4 lg:col-span-2">
          <div className="font-semibold mb-2">Monthly Budgets by Category</div>
          <div className="space-y-4">
            {bars.map(row => (
              <div key={row.key} className="p-3 rounded-xl border">
                <div className="flex justify-between text-sm mb-1">
                  <div className="font-medium">{row.key}</div>
                  <div className="text-gray-600">{currency(row.spent)} / {currency(row.budget)} ({Math.round(row.pct)}%)</div>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${row.pct}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Remaining: {currency(row.remaining)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* pie drilldown */}
        <div className="bg-white border rounded-2xl p-4">
          <div className="font-semibold mb-2">Spending Breakdown</div>

          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            {crumb.map((c, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <span className="mx-1">›</span>}
                <button className="hover:underline" onClick={c.onClick}>{c.label}</button>
              </div>
            ))}
            {drill.level !== "primary" && (
              <button
                className="ml-auto text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
                onClick={() => setDrill(d =>
                  d.level === "tertiary" && d.primaryKey ? { level: "secondary", primaryKey: d.primaryKey } : { level: "primary" }
                )}
              >
                Up one level
              </button>
            )}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} onClick={onSliceClick}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => currency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-gray-500 mt-2">Tip: click a slice to drill down.</div>
        </div>

        {/* transactions */}
        <div className="bg-white border rounded-2xl p-4 lg:col-span-3">
          <div className="font-semibold mb-2">Transactions (mock)</div>
          <div className="flex gap-2 mb-3">
            <input
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Search merchant or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">Apply AI Tagging</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredTx.map(t => (
              <div key={t.id} className="border rounded-2xl p-3">
                <div className="flex justify-between">
                  <div className="font-medium">{t.merchant}</div>
                  <div className="font-semibold">{currency(t.amount)}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{t.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
