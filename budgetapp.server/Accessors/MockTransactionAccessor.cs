using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using budgetapp.server.Data;

namespace BudgetApp.Server.Accessors
{
    public class MockTransactionAccessor : ITransactionAccessor
    {
        // Returns copies so callers cannot mutate the internal list or its parent references.
        public List<Transaction> GetAll(string userId)
        {
            return MockDB.GetTransactions(userId);
        }

        // No-op: do not persist; return the incoming tag.
        public void Add(string userId, Transaction transaction)
        {
            MockDB.AddTransaction(userId, transaction);
        }
    }
}