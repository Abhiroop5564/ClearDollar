import { Navbar } from "../Components/Navbar";
import { useEffect, useState, useMemo } from 'react';




function getPrimaryTags(tags) {
    if (tags === undefined) return;
    console.log(tags)
    const table = [];
    for (const tag of tags) {
        if (tag.parentTagId === null) {
            table.push(tag);
        }
    }
    console.log("primaryTags: ", table);
    return table;
};

const currency = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function Dashboard() {

    const [tags, setTags] = useState();
    const [transactions, setTransactions] = useState();
    useEffect(() => {
        populateTags();
        populateTransactions();
        
    }, []);

    const [primaryTags, setPrimaryTags] = useState();
    useEffect(() => { setPrimaryTags(getPrimaryTags(tags)) }, [tags]);

    const [tagTotals, setTagTotals] = useState();
    useEffect(() => { calculateTagTotals(transactions, tags); }, [transactions, tags]);

    const [barsData, setBarsData] = useState();
    useEffect(() => {
        if (!primaryTags || !tagTotals) return;
        const data = primaryTags.map(tag => {
            const spent = tagTotals[tag.tagName] || 0;
            const budget = tag.budgetAmount || 0;
            return {
                key: tag.tagName,
                budget,
                spent,
                pct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
                remaining: Math.max(0, budget - spent)
            };
        });

        setBarsData(data);
    }, [primaryTags, tagTotals]);
       
    

    return (
        <>
            <Navbar />


            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* budget bars */}
                    <div className="bg-white border rounded-2xl p-4 lg:col-span-2">
                        <div className="font-semibold mb-2">Monthly Budgets by Category</div>
                        <div className="space-y-4">
                            {(barsData === undefined)
                                ? <div>Loading...</div>
                                : barsData.map(row => (
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
                </div>
            </div>
        </>
    );

    function calculateTagTotals(transactions,tags) {
        if (transactions === undefined) return;
        if (tags === undefined) return;
        let tagTotals = {}
        for (const [key, value] of Object.entries(transactions)) {
            let transactionTagId = value.tagId
            if (transactionTagId === null) {
                continue;
            }
            let tag = tags.find(tag => tag.tagId == transactionTagId)
            if (tag === null) {
                console.log("No tag found for tagId: ", transactionTagId);
                continue;
            }
            tagTotals[tag.tagName] = (tagTotals[tag.tagName] || 0) + value.amount;
        }
        setTagTotals(tagTotals);
        console.log("Tag totals:", tagTotals);
    }


    async function populateTags() {

        console.log("Populating tags...");
        const response = await fetch('/tags?userId=demo-user');
        if (response.ok) {
            const data = await response.json();
            setTags(data);
        }
    }

    async function populateTransactions() {
        console.log("Populating transactions...");
        const response = await fetch('/transactions?userId=demo-user');
        if (response.ok) {
            const data = await response.json();
            setTransactions(data);
        }
    }



}