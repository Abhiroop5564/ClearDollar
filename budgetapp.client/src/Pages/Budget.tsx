import React, { useEffect, useState } from "react";
import { Navbar } from "../Components/Navbar";

import {
    SortableTree,
    SimpleTreeItemWrapper,
    type TreeItems,
    type TreeItemComponentProps,
} from "dnd-kit-sortable-tree";

type Mode = "income" | "expenses";

// match backend enum: Income = 1, Expense = 2
type TagType = 1 | 2;

type TagDto = {
    tagId: number;
    parentTagId: number | null;
    tagName: string;
    budgetAmount: number;
    tagType: TagType;
};

type TagTreeNode = {
    id: string;
    tagId: number;
    parentTagId: number | null;
    tagName: string;
    budgetAmount: number;
    tagType: TagType;
    children: TagTreeNode[];
    collapsed?: boolean; // <-- allow initial collapse
};

function isIncomeTag(t: TagDto) {
    return t.tagType === 1;
}
function isExpenseTag(t: TagDto) {
    return t.tagType === 2;
}

/** Build a tree from flat tags (all nodes start collapsed). */
function buildTreeFromFlatTags(tags: TagDto[]): TreeItems<TagTreeNode> {
    const byId = new Map<number, TagTreeNode>();

    for (const t of tags) {
        byId.set(t.tagId, {
            id: String(t.tagId),
            tagId: t.tagId,
            parentTagId: t.parentTagId,
            tagName: t.tagName,
            budgetAmount: t.budgetAmount,
            tagType: t.tagType,
            children: [],
            collapsed: true, // <-- start collapsed
        });
    }

    const roots: TagTreeNode[] = [];

    for (const node of byId.values()) {
        if (node.parentTagId == null) {
            roots.push(node);
            continue;
        }
        const parent = byId.get(node.parentTagId);
        if (parent) parent.children.push(node);
        else {
            node.parentTagId = null;
            roots.push(node);
        }
    }

    return roots;
}

/** Derive {tagId,parentTagId} for a whole tree (what you typically want to save). */
function flattenTreeWithParents(
    items: TreeItems<TagTreeNode>,
    parentId: number | null = null
): Array<Pick<TagDto, "tagId" | "parentTagId">> {
    const out: Array<Pick<TagDto, "tagId" | "parentTagId">> = [];
    for (const node of items) {
        out.push({ tagId: node.tagId, parentTagId: parentId });
        if (node.children?.length) {
            out.push(...flattenTreeWithParents(node.children, node.tagId));
        }
    }
    return out;
}

function updateNodeBudget(
    items: TreeItems<TagTreeNode>,
    tagId: number,
    newBudgetAmount: number
): TreeItems<TagTreeNode> {
    return items.map((node) => {
        if (node.tagId === tagId) {
            return { ...node, budgetAmount: newBudgetAmount };
        }
        if (node.children?.length) {
            return { ...node, children: updateNodeBudget(node.children, tagId, newBudgetAmount) };
        }
        return node;
    });
}

function updateNodeName(
    items: TreeItems<TagTreeNode>,
    tagId: number,
    newName: string
): TreeItems<TagTreeNode> {
    return items.map((node) => {
        if (node.tagId === tagId) {
            return { ...node, tagName: newName };
        }
        if (node.children?.length) {
            return { ...node, children: updateNodeName(node.children, tagId, newName) };
        }
        return node;
    });
}

function syncParentIds(
    items: TreeItems<TagTreeNode>,
    parentId: number | null = null
): TreeItems<TagTreeNode> {
    return items.map((node) => ({
        ...node,
        parentTagId: parentId,
        children: syncParentIds(node.children ?? [], node.tagId),
    }));
}

function toParentMap(pairs: Array<{ tagId: number; parentTagId: number | null }>) {
    const m = new Map<number, number | null>();
    for (const p of pairs) m.set(p.tagId, p.parentTagId);
    return m;
}

function diffParentChanges(
    prevItems: TreeItems<TagTreeNode>,
    nextItems: TreeItems<TagTreeNode>
) {
    const prev = toParentMap(flattenTreeWithParents(prevItems));
    const next = toParentMap(flattenTreeWithParents(nextItems));

    const changed: Array<{ tagId: number; parentTagId: number | null }> = [];
    for (const [tagId, nextParent] of next.entries()) {
        const prevParent = prev.get(tagId);
        if (prevParent !== nextParent) changed.push({ tagId, parentTagId: nextParent });
    }
    return changed;
}



export function BudgetPage() {
    const USER_ID = localStorage.getItem("userId")!;

    const [mode, setMode] = useState<Mode>("expenses");
    const [allTags, setAllTags] = useState<TagDto[] | undefined>(undefined);

    const [incomeTree, setIncomeTree] = useState<TreeItems<TagTreeNode>>([]);
    const [expensesTree, setExpensesTree] = useState<TreeItems<TagTreeNode>>([]);

    const [saveStatus, setSaveStatus] = useState<
        { kind: "ok"; message: string } | { kind: "err"; message: string } | null
    >(null);

    useEffect(() => {
        populateTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!allTags) return;

        const income = allTags.filter(isIncomeTag);
        const expenses = allTags.filter(isExpenseTag);

        setIncomeTree(buildTreeFromFlatTags(income));
        setExpensesTree(buildTreeFromFlatTags(expenses));
    }, [allTags]);

    const activeTree = mode === "income" ? incomeTree : expensesTree;
    const setActiveTree = mode === "income" ? setIncomeTree : setExpensesTree;

    async function addTag() {
        setSaveStatus(null);

        const defaultName = mode === "income" ? "New Income Tag" : "New Expense Tag";
        const defaultAmount = mode === "income" ? 0 : 0; // user edits; sign enforced on Enter

        const tagType = mode === "income" ? 1 : 2;

        const res = await fetch(`/tags?userId=${encodeURIComponent(USER_ID)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                parentTagId: null,
                tagName: defaultName,
                budgetAmount: defaultAmount,
                tagType,
            }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            setSaveStatus({ kind: "err", message: text || `Create failed: ${res.status}` });
            return;
        }

        const created = (await res.json()) as TagDto;

        const newNode: TagTreeNode = {
            id: String(created.tagId),
            tagId: created.tagId,
            parentTagId: created.parentTagId,
            tagName: created.tagName,
            budgetAmount: Number(created.budgetAmount),
            tagType: created.tagType,
            children: [],
            collapsed: true,
        };

        if (mode === "income") {
            setIncomeTree((prev) => syncParentIds([newNode, ...prev]));
        } else {
            setExpensesTree((prev) => syncParentIds([newNode, ...prev]));
        }
    }

    async function patchTag(tagId: number, patch: { tagName?: string; budgetAmount?: number }, parentTagId: number | null) {
        const res = await fetch(`/tags/${tagId}?userId=${encodeURIComponent(USER_ID)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...patch, parentTagId }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || `Update failed: ${res.status}`);
        }
    }

    async function patchTagParent(tagId: number, parentTagId: number | null) {
        const res = await fetch(`/tags/${tagId}?userId=${encodeURIComponent(USER_ID)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parentTagId }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || `Update failed: ${res.status}`);
        }
    }

    const TreeRow = React.forwardRef<HTMLDivElement, TreeItemComponentProps<TagTreeNode>>(
        (props, ref) => {
            const { item } = props;

            /* ---------------- Name editing ---------------- */

            const [nameDraft, setNameDraft] = useState(item.tagName);

            useEffect(() => {
                setNameDraft(item.tagName);
            }, [item.tagName]);

            /* ---------------- Budget editing ---------------- */

            const displayAmount = item.budgetAmount;

            const [amountDraft, setAmountDraft] = useState(String(displayAmount));

            useEffect(() => {
                setAmountDraft(String(item.budgetAmount));
            }, [item.budgetAmount]);

            return (
                <SimpleTreeItemWrapper {...props} ref={ref}>
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-white">
                        {/* -------- Editable Name -------- */}
                        <div
                            className="flex-1"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                className="w-full font-semibold bg-transparent outline-none border-b border-transparent focus:border-gray-300"
                                value={nameDraft}
                                onPointerDownCapture={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    e.stopPropagation();

                                    if (e.key === "Enter") {
                                        const trimmed = nameDraft.trim();
                                        if (!trimmed) return;

                                        setSaveStatus(null);

                                        // optimistic UI
                                        setActiveTree((prev) => updateNodeName(prev, item.tagId, trimmed));

                                        // persist
                                        patchTag(item.tagId, { tagName: trimmed }, item.parentTagId)
                                            .then(() => setSaveStatus({ kind: "ok", message: "Updated." }))
                                            .catch((err) => {
                                                setSaveStatus({ kind: "err", message: err?.message ?? "Update failed." });
                                                // optional: refetch to re-sync if you want strict correctness
                                                populateTags();
                                            });

                                        e.currentTarget.blur();
                                    }

                                    if (e.key === "Escape") {
                                        setNameDraft(item.tagName);
                                        e.currentTarget.blur();
                                    }
                                }}
                                onChange={(e) => setNameDraft(e.target.value)}
                            />
                            <div className="text-xs text-gray-500">
                                TagID: {item.tagId} | ParentID: {item.parentTagId ?? "null"}
                            </div>
                        </div>

                        {/* -------- Editable Budget -------- */}
                        <div
                            className="flex items-center gap-2"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-xs text-gray-500">Amount</span>
                            <input
                                type="number"
                                className="w-32 px-3 py-2 rounded-xl border text-sm"
                                value={amountDraft}
                                onPointerDownCapture={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    e.stopPropagation();

                                    if (e.key === "Enter") {
                                        const raw = Number(amountDraft);
                                        if (!Number.isFinite(raw)) return;

                                        const committed = Math.abs(raw); // Option A: always positive budgets

                                        setSaveStatus(null);

                                        // optimistic UI
                                        setActiveTree((prev) => updateNodeBudget(prev, item.tagId, committed));

                                        // persist
                                        patchTag(item.tagId, { budgetAmount: committed }, item.parentTagId)
                                            .then(() => setSaveStatus({ kind: "ok", message: "Updated." }))
                                            .catch((err) => {
                                                setSaveStatus({ kind: "err", message: err?.message ?? "Update failed." });
                                                populateTags();
                                            });

                                        e.currentTarget.blur();
                                    }

                                    if (e.key === "Escape") {
                                        setAmountDraft(String(item.budgetAmount));
                                        e.currentTarget.blur();
                                    }
                                }}
                                onChange={(e) => setAmountDraft(e.target.value)}
                            />
                        </div>
                    </div>
                </SimpleTreeItemWrapper>
            );
        }
    );
    TreeRow.displayName = "TreeRow";

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                    <div className="bg-white border rounded-2xl p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-lg font-semibold">Budget</div>
                                    <div className="text-sm text-gray-500">
                                        Edit tags or drag and drop to reorder.
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                                    <button
                                        className={`px-6 py-3 rounded-xl border text-sm font-semibold transition
    ${mode === "expenses"
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-900 hover:bg-gray-50"
                                            }
    `}
                                        onClick={() => setMode("expenses")}
                                        type="button"
                                    >
                                        Expenses
                                    </button>

                                    <button
                                        className={`px-6 py-3 rounded-xl border text-sm font-semibold transition
    ${mode === "income"
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-900 hover:bg-gray-50"
                                            }
    `}
                                        onClick={() => setMode("income")}
                                        type="button"
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                            {saveStatus && (
                                <div
                                    className={`text-sm rounded-xl border px-4 py-3 ${saveStatus.kind === "ok"
                                            ? "border-green-200 bg-green-50 text-green-800"
                                            : "border-red-200 bg-red-50 text-red-800"
                                        }`}
                                >
                                    {saveStatus.message}
                                </div>
                            )}
                        </div>
                    </div>
                    {allTags === undefined ? (
                        <p className="text-center">
                            <em>
                                Loading... Please refresh once the ASP.NET backend has started. See{" "}
                                <a href="https://aka.ms/jspsintegrationreact">
                                    https://aka.ms/jspsintegrationreact
                                </a>{" "}
                                for more details.
                            </em>
                        </p>
                    ) : (
                        <div className="bg-white border rounded-2xl p-4">

                            <div className="flex mb-3">
                                <button
                                    className="px-6 py-3 rounded-xl border text-sm font-semibold transition bg-white text-gray-900 hover:bg-gray-50"
                                    onClick={addTag}
                                    type="button"
                                >
                                    Add Tag
                                </button>
                            </div>

                            <SortableTree<TagTreeNode>
                                items={activeTree}
                                onItemsChanged={(newItems) => {
                                    setSaveStatus(null);

                                    // normalize parentTagId fields in the new tree
                                    const synced = syncParentIds(newItems);

                                    // compute which nodes changed parent (compare against current activeTree)
                                    const changes = diffParentChanges(activeTree, synced);

                                    // update UI immediately
                                    setActiveTree(synced);

                                    if (changes.length === 0) return;

                                    // persist only changed nodes
                                    Promise.allSettled(changes.map((c) => patchTagParent(c.tagId, c.parentTagId)))
                                        .then((results) => {
                                            const failed = results.some((r) => r.status === "rejected");
                                            setSaveStatus(
                                                failed
                                                    ? { kind: "err", message: "Some moves failed to save. Refresh to re-sync." }
                                                    : { kind: "ok", message: "Saved." }
                                            );
                                        })
                                        .catch(() => {
                                            setSaveStatus({ kind: "err", message: "Move save failed." });
                                        });
                                }}
                                TreeItemComponent={TreeRow}
                                dropAnimation={null}
                                sortableProps={{ animateLayoutChanges: () => false }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    async function populateTags() {
        const response = await fetch(`/tags?userId=${encodeURIComponent(USER_ID)}`);
        if (response.ok) {
            const data = (await response.json()) as TagDto[];
            setAllTags(data);
        } else {
            setAllTags([]);
        }
    }
}
