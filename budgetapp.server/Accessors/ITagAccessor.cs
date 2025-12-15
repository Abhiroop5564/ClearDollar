using System.Collections.Generic;
using budgetapp.server.Data;
using BudgetApp.Server.Controllers;

namespace BudgetApp.Server.Accessors
{
    public interface ITagAccessor
    {
        Tag? GetById(string userId, int tagId);
        List<Tag> GetAll(string userId);
        void Add(string userId, Tag tag);
        void Update(Tag tag);
    }
}