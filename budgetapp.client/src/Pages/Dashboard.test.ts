import { describe, it, expect } from 'vitest';
import { buildTagTreeByMode, buildDirectTotalsByMode } from './Dashboard';

describe('Dashboard Logic', () => {

    describe('buildTagTreeByMode', () => {
        it('should filter tags by mode and build hierarchy', () => {
            const tags = [
                { tagId: 1, parentTagId: null, tagName: "Income Root", budgetAmount: 0, tagType: 1 }, // Income
                { tagId: 2, parentTagId: null, tagName: "Expense Root", budgetAmount: 0, tagType: 2 }, // Expense
                { tagId: 3, parentTagId: 2, tagName: "Expense Child", budgetAmount: 0, tagType: 2 },   // Expense Child
            ];

            // Act - Expenses
            const expenseTree = buildTagTreeByMode(tags, 'expenses');
            
            // Assert
            expect(expenseTree).toHaveLength(1);
            expect(expenseTree[0].tagId).toBe(2);
            expect(expenseTree[0].children).toHaveLength(1);
            expect(expenseTree[0].children[0].tagId).toBe(3);

            // Act - Income
            const incomeTree = buildTagTreeByMode(tags, 'income');
            expect(incomeTree).toHaveLength(1);
            expect(incomeTree[0].tagId).toBe(1);
        });

        it('should return empty array if no tags match mode', () => {
            const tags = [{ tagId: 1, tagType: 1 }]; // Only income
            const result = buildTagTreeByMode(tags, 'expenses');
            expect(result).toEqual([]);
        });
    });

    describe('buildDirectTotalsByMode', () => {
        it('should sum expenses as positive magnitude', () => {
            const txs = [
                { tagId: 1, amount: -50 },
                { tagId: 1, amount: -25 },
                { tagId: 2, amount: -10 }
            ];

            const totals = buildDirectTotalsByMode(txs, 'expenses');

            expect(totals[1]).toBe(75); // abs(-50 + -25) -> NO, logic sums individual magnitudes
            // Logic check: The provided code does: totals[t.tagId] = (totals[t.tagId] || 0) + magnitude;
            // where magnitude = Math.abs(amt).
            
            expect(totals[2]).toBe(10);
        });

        it('should ignore income transactions when in expense mode', () => {
            const txs = [
                { tagId: 1, amount: -50 },
                { tagId: 1, amount: 1000 } // Income
            ];

            const totals = buildDirectTotalsByMode(txs, 'expenses');
            
            expect(totals[1]).toBe(50);
        });

        it('should ignore expense transactions when in income mode', () => {
            const txs = [
                { tagId: 1, amount: 1000 },
                { tagId: 1, amount: -50 } // Expense
            ];

            const totals = buildDirectTotalsByMode(txs, 'income');

            expect(totals[1]).toBe(1000);
        });
    });
});