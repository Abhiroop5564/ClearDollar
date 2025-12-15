using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using budgetapp.server.Data;

namespace BudgetApp.Server.Accessors
{
    public class MockTagAccessor : ITagAccessor
    {
        // Returns copies so callers cannot mutate the internal list or its parent references.
        public List<Tag> GetAll(string userId)
        {
            return MockDB.GetTags(userId);
        }

        // No-op: do not persist; return the incoming tag.
        public void Add(string userId, Tag tag)
        {
            MockDB.AddTag(userId, tag);
        }
    }
}