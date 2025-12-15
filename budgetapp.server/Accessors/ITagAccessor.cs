using System.Collections.Generic;
using budgetapp.server.Data;
using BudgetApp.Server.Controllers;

namespace BudgetApp.Server.Accessors
{
    public interface ITagAccessor
    {
        List<Tag> GetAll(string userId);
        void Add(string userId, Tag tag);
        //void ApplyTagUpdates(string userId, List<TagDto> tags);
    }
}