using budgetapp.server.Data;

namespace BudgetApp.Server.Controllers
{
    public class CreateTagRequest
    {
        public int? ParentTagId { get; set; }  // null = root
        public string TagName { get; set; } = "New Tag";
        public decimal BudgetAmount { get; set; } = 0m;

        public TagType TagType { get; set; }  // required
    }
}