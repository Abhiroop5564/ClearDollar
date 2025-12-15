using System.Collections.Generic;
using System.Linq;
using budgetapp.server.Data;

namespace BudgetApp.Server.Engines
{
    public class TagEngine
    {
        public List<string> ValidateBudgetHierarchy(List<Tag> tags)
        {
            var errors = new List<string>();

            // 1. Group children by their ParentTagId for fast lookup
            // We filter out tags where ParentTagId is null (roots)
            var childrenMap = tags
                .Where(t => t.ParentTagId.HasValue)
                .GroupBy(t => t.ParentTagId.Value)
                .ToDictionary(g => g.Key, g => g.ToList());

            // 2. Iterate through every tag to see if it acts as a parent
            foreach (var parentTag in tags)
            {
                // If this tag has children defined in our map
                if (childrenMap.ContainsKey(parentTag.TagId))
                {
                    var children = childrenMap[parentTag.TagId];
                    decimal childrenTotal = children.Sum(c => c.BudgetAmount);

                    // 3. Validation Logic
                    if (childrenTotal > parentTag.BudgetAmount)
                    {
                        errors.Add($"Error: Parent Tag '{parentTag.TagName}' (ID: {parentTag.TagId}) has a budget of {parentTag.BudgetAmount:C}, but its children sum to {childrenTotal:C}.");
                    }
                }
            }

            return errors;
        }
    }
}