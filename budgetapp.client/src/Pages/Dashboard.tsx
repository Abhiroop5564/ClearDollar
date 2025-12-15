import { Navbar } from "../Components/Navbar";
import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/* -----------------------------------------------------
   Utilities
----------------------------------------------------- */

// Format currency (always shows $ with sign based on number)
const currency = (n) =>
    Number(n).toLocaleString(undefined, { style: "currency", currency: "USD" });

type TagType = 1 | 2; // backend enum: Income=1, Expense=2
type Mode = "expenses" | "income";

type TagDto = {
    tagId: number;
    parentTagId: number | null;
    tagName: string;
    budgetAmount: number;
    tagType: TagType;
};

/** Convert flat tags into a nested tree, filtered by explicit tagType */
function buildTagTreeByMode(tags: any, mode: Mode) {
    if (!tags) return [];

    const list: TagDto[] = Array.isArray(tags) ? tags : Object.values(tags);

    const wantedType: TagType = mode === "income" ? 1 : 2;

    // Keep only tags of the requested type
    const filtered = list.filter((t) => t && t.tagType === wantedType);

    // Build id -> node map
    const nodeMap = new Map<number, any>();
    filtered.forEach((t) =>
        nodeMap.set(t.tagId, { ...t, children: [] })
    );

    // Wire up parent/child only within filtered set
    const roots: any[] = [];
    for (const node of nodeMap.values()) {
        const pid = node.parentTagId;
        if (pid != null && nodeMap.has(pid)) {
            nodeMap.get(pid).children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}


/**
 * Build a direct totals map (tagId → sum of tx amounts with exactly that tagId),
 * BUT filtered by mode:
 * - expenses: take negative tx only, store as positive magnitude
 * - income: take positive tx only, store as positive
 */
function buildDirectTotalsByMode(transactions: { [s: string]: unknown; } | ArrayLike<unknown> | undefined, mode: string) {
    if (!transactions) return {};

    const totals = {};
    for (const t of Object.values(transactions)) {
        if (t?.amount == null) continue;

        const amt = Number(t.amount);
        const isExpense = amt < 0;
        const isIncome = amt > 0;

        if (mode === "expenses" && !isExpense) continue;
        if (mode === "income" && !isIncome) continue;

        const magnitude = mode === "expenses" ? Math.abs(amt) : amt;

        if (!t.tagId) continue;
        totals[t.tagId] = (totals[t.tagId] || 0) + magnitude;
    }

    return totals;
}

/** Recursively sum totals for a tag and its descendants */
function getTotalForNode(node: { tagId: string | number; children: any; }, directTotals: { [x: string]: number; }) {
    let sum = directTotals[node.tagId] || 0;
    for (const child of node.children) {
        sum += getTotalForNode(child, directTotals);
    }
    return sum;
}

/** Walk the tag tree using the drillPath */
function getCurrentNode(tagTree: string | any[], drillPath: string | any[]) {
    if (!tagTree) return null;

    // If this mode has no tags, still return a valid root node.
    // This lets root-level "Other (Untagged)" show up.
    if (tagTree.length === 0) {
        return { tagId: null, tagName: "All Categories", children: [] };
    }

    if (drillPath.length === 0) {
        return { tagId: null, tagName: "All Categories", children: tagTree };
    }

    let nodes = tagTree;
    let node = null;

    for (const id of drillPath) {
        node = nodes.find((n: { tagId: any; }) => n.tagId === id);
        if (!node) return null;
        nodes = node.children;
    }

    return node;
}

/** Build breadcrumbs from the drillPath */
function buildBreadcrumbs(tagTree: any[], drillPath: string | any[]) {
    if (!tagTree) return [{ label: "All Categories", tagId: null }];

    const crumbs = [{ label: "All Categories", tagId: null }];
    let nodes = tagTree;

    for (let i = 0; i < drillPath.length; i++) {
        const id = drillPath[i];
        const node = nodes.find((n: { tagId: any; }) => n.tagId === id);
        if (!node) break;

        crumbs.push({ label: node.tagName, tagId: id });
        nodes = node.children;
    }

    return crumbs;
}

/**
 * Compute untagged total per mode:
 * - expenses: sum abs(negative untagged)
 * - income: sum positive untagged
 */
function computeUntaggedTotalByMode(transactions: { [s: string]: unknown; } | ArrayLike<unknown> | undefined, mode: string) {
    if (!transactions) return 0;

    return Object.values(transactions).reduce((sum, t) => {
        if (t?.tagId != null) return sum;
        const amt = Number(t.amount || 0);

        if (mode === "expenses") {
            return amt < 0 ? sum + Math.abs(amt) : sum;
        }

        // income
        return amt > 0 ? sum + amt : sum;
    }, 0);
}

/* -----------------------------------------------------
   Colors for pie slices
----------------------------------------------------- */
const COLORS = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
    "#f97316",
    "#06b6d4",
    "#e11d48",
];

/* -----------------------------------------------------
   Component
----------------------------------------------------- */

export function Dashboard() {
    const USER_ID = localStorage.getItem("userId")!;

    const [tags, setTags] = useState();
    const [transactions, setTransactions] = useState();

    const tagsLoading = tags === undefined;
    const txLoading = transactions === undefined;
    // "no data" = loaded transactions and there are none
    const noTx = !txLoading && Array.isArray(transactions) && transactions.length === 0;

    // NEW: mode toggle (no net mode)
    const [mode, setMode] = useState("expenses"); // "expenses" | "income"

    // Drilldown path (array of tagIds)
    const [drillPath, setDrillPath] = useState([]);

    useEffect(() => {
        populateTags();
        populateTransactions();
    }, []);

    // OPTIONAL: when switching mode, pop back to root (clean UX)
    useEffect(() => {
        setDrillPath([]);
    }, [mode]);

    /* Build tag tree */
    const tagTree = useMemo(() => buildTagTreeByMode(tags, mode), [tags, mode]);

    /* Direct totals by mode */
    const directTotals = useMemo(
        () => buildDirectTotalsByMode(transactions, mode),
        [transactions, mode]
    );

    /* Untagged total by mode */
    const untaggedTotal = useMemo(
        () => computeUntaggedTotalByMode(transactions, mode),
        [transactions, mode]
    );

    /* Breadcrumbs */
    const breadcrumbs = useMemo(
        () => buildBreadcrumbs(tagTree, drillPath),
        [tagTree, drillPath]
    );

    /* Current node in the tree */
    const currentNode = useMemo(
        () => getCurrentNode(tagTree, drillPath),
        [tagTree, drillPath]
    );

    /* Pie data = children of current node */
    const pieData = useMemo(() => {
        if (!currentNode) return [];

        const children = currentNode.children || [];
        const items = [];

        // Add child categories
        for (const child of children) {
            const v = getTotalForNode(child, directTotals);
            items.push({
                id: child.tagId,
                name: child.tagName,
                tagId: child.tagId,
                value: v,
                isLeaf: !child.children?.length,
            });
        }

        // Add "Other" if this node has its own direct transactions
        const selfDirectTotal = directTotals[currentNode.tagId] || 0;
        if (selfDirectTotal > 0) {
            items.push({
                id: `${currentNode.tagId}-other`,
                name: "Other",
                tagId: null, // no drill-down
                value: selfDirectTotal,
                isLeaf: true,
                isOther: true,
            });
        }

        // Root-level untagged bucket
        if (drillPath.length === 0 && untaggedTotal > 0) {
            items.push({
                id: "root-other",
                name: "Other",
                tagId: null,
                value: untaggedTotal,
                isLeaf: true,
                isOther: true,
            });
        }

        // OPTIONAL: remove zero slices (keeps chart clean)
        return items.filter((x) => Number(x.value) > 0);
    }, [currentNode, directTotals, drillPath, untaggedTotal]);

    /* Budget bars data — children of current drill node */
    const barsData = useMemo(() => {
        if (!tagTree || !currentNode) return [];

        const children = currentNode.children || [];
        const items = [];

        for (const child of children) {
            const spentOrEarned = getTotalForNode(child, directTotals);
            const budget = Number(child.budgetAmount || 0);

            // For income mode, budget may not make semantic sense — we still display it as-is.
            const pct = budget > 0 ? Math.min(100, (spentOrEarned / budget) * 100) : 0;

            items.push({
                key: child.tagName,
                spent: spentOrEarned,
                budget,
                pct,
                remaining: budget - spentOrEarned,
            });
        }

        const selfDirectTotal = directTotals[currentNode.tagId] || 0;
        if (selfDirectTotal > 0) {
            items.push({
                key: "Other",
                spent: selfDirectTotal,
                budget: 0,
                pct: 0,
                remaining: 0,
                isOther: true,
            });
        }

        if (drillPath.length === 0 && untaggedTotal > 0) {
            items.push({
                key: "Other (Untagged)",
                spent: untaggedTotal,
                budget: 0,
                pct: 0,
                remaining: 0,
                isOther: true,
            });
        }

        return items;
    }, [tagTree, currentNode, directTotals, drillPath, untaggedTotal]);

    /** Click a pie slice → drill deeper */
    function onSliceClick(entry: { tagId: any; }) {
        const tagId = entry?.tagId;
        if (!tagId) return;

        const childNode = currentNode.children.find((c: { tagId: any; }) => c.tagId === tagId);

        // Do NOT drill into leaf nodes
        if (!childNode?.children?.length) return;

        setDrillPath((path) => [...path, tagId]);
    }

    /** Breadcrumb click */
    function goToBreadcrumb(index: number | undefined) {
        if (index === 0) setDrillPath([]);
        else setDrillPath(drillPath.slice(0, index));
    }

    /* -----------------------------------------------------
       API
    ----------------------------------------------------- */
    async function populateTags() {
        const response = await fetch(`/tags?userId=${encodeURIComponent(USER_ID)}`);
        if (response.ok) {
            const data = await response.json();
            setTags(data);
        }
    }

    async function populateTransactions() {
        const response = await fetch(`/transactions?userId=${encodeURIComponent(USER_ID)}`);
        if (response.ok) {
            const data = await response.json();
            setTransactions(data);
        }
    }

    /* -----------------------------------------------------
       Render
    ----------------------------------------------------- */

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                    {/* ---------------------- */}
                    {/* Mode Toggle */}
                    {/* ---------------------- */}
                    <div className="bg-white border rounded-2xl p-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <div>
                                <div className="text-lg font-semibold">Dashboard</div>
                                <div className="text-sm text-gray-500">
                                    See where your money is going.
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                                <button
                                    className={`px-6 py-3 rounded-xl border text-sm font-semibold transition
                    ${mode === "expenses" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 hover:bg-gray-50"}
                  `}
                                    onClick={() => setMode("expenses")}
                                >
                                    Expenses
                                </button>

                                <button
                                    className={`px-6 py-3 rounded-xl border text-sm font-semibold transition
                    ${mode === "income" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 hover:bg-gray-50"}
                  `}
                                    onClick={() => setMode("income")}
                                >
                                    Income
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ---------------------- */}
                    {/* Main Grid */}
                    {/* ---------------------- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* ---------------------- */}
                        {/* Budget Bars */}
                        {/* ---------------------- */}
                        <div className="bg-white border rounded-2xl p-4 lg:col-span-2">
                            <div className="font-semibold mb-2">
                                {mode === "expenses" ? "Monthly Budgets by Category" : "Income by Category"}
                            </div>

                            <div className="space-y-4">
                                {txLoading || tagsLoading ? (
                                    <div className="text-sm text-gray-500">Loading…</div>
                                ) : noTx ? (
                                    <div className="text-sm text-gray-500">No data</div>
                                ) : barsData.length === 0 ? (
                                    <div className="text-sm text-gray-500">No categories</div>
                                ) : (
                                    barsData.map((row) => (
                                        <div key={row.key} className="p-3 rounded-xl border">
                                            <div className="flex justify-between text-sm mb-1">
                                                <div className="font-medium">{row.key}</div>
                                                <div className="text-gray-600">
                                                    {currency(row.spent)} / {currency(row.budget)} ({Math.round(row.pct)}%)
                                                </div>
                                            </div>

                                            {Number(row.budget) > 0 ? (
                                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${row.spent > row.budget ? "bg-red-600" : "bg-blue-600"
                                                            }`}
                                                        style={{ width: `${row.pct}%` }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-2 w-full" />
                                            )}

                                            <div className="text-xs text-gray-500 mt-1">
                                                Remaining: {currency(row.remaining)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ---------------------- */}
                        {/* Pie Chart Drilldown */}
                        {/* ---------------------- */}
                        <div className="bg-white border rounded-2xl p-4">
                            <div className="font-semibold mb-2">
                                {mode === "expenses" ? "Spending Breakdown" : "Income Breakdown"}
                            </div>

                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-3 flex-wrap">
                                {breadcrumbs.map((c, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center cursor-pointer hover:underline"
                                        onClick={() => goToBreadcrumb(i)}
                                    >
                                        {i > 0 && <span className="mx-1">&gt;</span>}
                                        {c.label}
                                    </div>
                                ))}
                            </div>

                            {/* Pie */}
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={100}
                                            onClick={onSliceClick}
                                        >
                                            {pieData.map((slice, idx) => (
                                                <Cell
                                                    key={slice.id}
                                                    fill={slice.isOther ? "#9CA3AF" : COLORS[idx % COLORS.length]}
                                                    cursor={slice.isOther ? "default" : "pointer"}
                                                    opacity={slice.isOther ? 0.7 : 1}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => currency(Number(v))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="text-xs text-gray-500 mt-2">
                                Tip: click a slice to drill down.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
