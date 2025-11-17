import { Navbar } from "../Components/Navbar";
import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/* -----------------------------------------------------
   Utilities
----------------------------------------------------- */

// Format currency
const currency = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" });

/** Convert the flat tag list into a nested tree */
function buildTagTree(tags) {
    if (!tags) return [];

    const map = new Map();
    tags.forEach((t) => map.set(t.tagId, { ...t, children: [] }));

    let roots = [];

    for (const tag of map.values()) {
        if (tag.parentTagId === null) {
            roots.push(tag);
        } else {
            const parent = map.get(tag.parentTagId);
            if (parent) parent.children.push(tag);
        }
    }

    return roots;
}

/** Build a direct totals map (tagId → sum of tx amounts with exactly that tagId) */
function buildDirectTotals(transactions, tags) {
    if (!transactions || !tags) return {};

    const totals = {};

    for (const t of Object.values(transactions)) {
        if (!t.tagId) continue;
        totals[t.tagId] = (totals[t.tagId] || 0) + t.amount;
    }

    return totals;
}

/** Recursively sum totals for a tag and its descendants */
function getTotalForNode(node, directTotals) {
    let sum = directTotals[node.tagId] || 0;
    for (const child of node.children) {
        sum += getTotalForNode(child, directTotals);
    }
    return sum;
}

/** Walk the tag tree using the drillPath */
function getCurrentNode(tagTree, drillPath) {
    if (!tagTree || tagTree.length === 0) return null;

    if (drillPath.length === 0) {
        return { tagId: null, tagName: "All Categories", children: tagTree };
    }

    let nodes = tagTree;
    let node = null;

    for (const id of drillPath) {
        node = nodes.find((n) => n.tagId === id);
        if (!node) return null;
        nodes = node.children;
    }

    return node;
}

/** Build breadcrumbs from the drillPath */
function buildBreadcrumbs(tagTree, drillPath) {
    if (!tagTree) return [{ label: "All Categories", tagId: null }];

    let crumbs = [{ label: "All Categories", tagId: null }];
    let nodes = tagTree;

    for (let i = 0; i < drillPath.length; i++) {
        const id = drillPath[i];
        const node = nodes.find((n) => n.tagId === id);
        if (!node) break;

        crumbs.push({ label: node.tagName, tagId: id });
        nodes = node.children;
    }

    return crumbs;
}

function getBarNodesForDrill(tagTree, drillPath) {
    // Root level
    if (!drillPath.length) return tagTree;

    // Walk tree to the drill node
    let nodes = tagTree;
    let node = null;

    for (const id of drillPath) {
        node = nodes.find((n) => n.tagId === id);
        if (!node) return tagTree; // fallback
        nodes = node.children;
    }

    // If the node has children, return them
    if (node.children.length > 0) return node.children;

    // If no children, return just the node itself
    return [node];
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
    const [tags, setTags] = useState();
    const [transactions, setTransactions] = useState();

    useEffect(() => {
        populateTags();
        populateTransactions();
    }, []);

    /* Build tag tree */
    const tagTree = useMemo(() => buildTagTree(tags), [tags]);

    /* Direct totals: tx amounts by exact tagId */

    const directTotals = useMemo(() => buildDirectTotals(transactions, tags), [transactions, tags]);

    const untaggedTotal = useMemo(() => {
        if (!transactions) return 0;
        return Object.values(transactions).reduce(
            (sum, t) => (t.tagId == null ? sum + t.amount : sum),
            0
        );
    }, [transactions]);

    /* Drilldown path (array of tagIds) */
    const [drillPath, setDrillPath] = useState([]);

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
            items.push({
                id: child.tagId,
                name: child.tagName,
                tagId: child.tagId,
                value: getTotalForNode(child, directTotals),
                isLeaf: !child.children?.length
            });
        }

        // Add "Other" if this node has its own transactions
        const selfDirectTotal = directTotals[currentNode.tagId] || 0;
        if (selfDirectTotal > 0) {
            items.push({
                id: currentNode.tagId + "-other",
                name: "Other",
                tagId: null,        // no drill-down
                value: selfDirectTotal,
                isLeaf: true,
                isOther: true
            });
        }

        // 👇 Add this block for root level untagged transactions
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


        return items;
    }, [currentNode, directTotals]);

    /* Budget bars data — only top-level tags */
    const barsData = useMemo(() => {
        if (!tagTree || !directTotals || !currentNode) return [];

        // Nodes = children of current drill node
        const children = currentNode.children || [];
        const items = [];

        // add children
        for (const child of children) {
            const spent = getTotalForNode(child, directTotals);
            const budget = child.budgetAmount || 0;

            items.push({
                key: child.tagName,
                spent,
                budget,
                pct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
                remaining: budget - spent
            });
        }

        // add "Other" if there are direct transactions for this node
        const selfDirectTotal = directTotals[currentNode.tagId] || 0;
        if (selfDirectTotal > 0) {
            items.push({
                key: "Other",
                spent: selfDirectTotal,
                budget: 0,     // no budget
                pct: 0,
                remaining: 0
            });
        }

        // 👇 Add UNTAgGED "Other" for root level
        if (drillPath.length === 0 && untaggedTotal > 0) {
            items.push({
                key: "Other",
                spent: untaggedTotal,
                budget: 0,
                pct: 0,
                remaining: 0,
                isOther: true,
            });
        }

        return items;
    }, [tagTree, directTotals, currentNode]);

    /** Click a pie slice → drill deeper */
    function onSliceClick(entry) {
        const tagId = entry?.tagId;
        if (!tagId) return;

        // Find the corresponding node in the current level
        const childNode = currentNode.children.find(c => c.tagId === tagId);

        // Do NOT drill into leaf nodes
        if (!childNode || !childNode.children || childNode.children.length === 0) {
            return; // ignore click
        }

        // Drill deeper
        setDrillPath(path => [...path, tagId]);
    }


    /** Breadcrumb click */
    function goToBreadcrumb(index) {
        if (index === 0) setDrillPath([]);
        else setDrillPath(drillPath.slice(0, index));
    }

    /* -----------------------------------------------------
       API
    ----------------------------------------------------- */

    async function populateTags() {
        const response = await fetch("/tags?userId=demo-user");
        if (response.ok) {
            const data = await response.json();
            setTags(data);
        }
    }

    async function populateTransactions() {
        const response = await fetch("/transactions?userId=demo-user");
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
                <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ---------------------- */}
                    {/* Budget Bars */}
                    {/* ---------------------- */}
                    <div className="bg-white border rounded-2xl p-4 lg:col-span-2">
                        <div className="font-semibold mb-2">Monthly Budgets by Category</div>

                        <div className="space-y-4">
                            {!barsData.length ? (
                                <div>Loading...</div>
                            ) : (
                                barsData.map(row => (
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
                                                    className={`h-full ${row.spent > row.budget ? "bg-red-600" : "bg-blue-600"}`}
                                                    style={{ width: `${row.pct}%` }}
                                                />
                                            </div>
                                        ) : 
                                            <div className="h-2 w-full" /> 
                                        }

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
                        <div className="font-semibold mb-2">Spending Breakdown</div>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
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
                                            fill={slice.isOther ? "#9CA3AF" : COLORS[idx % COLORS.length]} // 👈 Always gray for Other
                                            cursor={slice.isOther ? "default" : "pointer"}
                                            opacity={slice.isOther ? 0.7 : 1}
                                        />
                                    ))}
                                    </Pie>
                                    <Tooltip formatter={v => currency(Number(v))} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="text-xs text-gray-500 mt-2">
                            Tip: click a slice to drill down.
                        </div>
                    </div>

                </div>
            </div>
        </>

    );
}
