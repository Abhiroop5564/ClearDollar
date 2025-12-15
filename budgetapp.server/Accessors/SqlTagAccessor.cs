using System.Collections.Generic;
using System.Linq;
using budgetapp.server.Data;
using BudgetApp.Server.Controllers;
using BudgetApp.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace BudgetApp.Server.Accessors
{
    public class SqlTagAccessor : ITagAccessor
    {
        private readonly BudgetDbContext _context;

        public SqlTagAccessor(BudgetDbContext context)
        {
            _context = context;
        }

        public List<Tag> GetAll(string userId)
        {
            // Filter by the specific UserId provided in the request
            return _context.Tags.Where(t => t.UserId == userId).ToList();
        }

        public void Add(string userId, Tag tag)
        {
            Console.WriteLine($"Adding tag for userId: {userId}");
            tag.UserId = userId; // Ensure the tag is assigned to the correct user
            _context.Tags.Add(tag);
            _context.SaveChanges();
        }

        //public void ApplyTagUpdates(string userId, List<TagDto> tags)
        //{
        //    var existing = _context.Tags
        //        .Where(t => t.UserId == userId)
        //        .ToDictionary(t => t.TagId);

        //    foreach (var dto in tags)
        //    {
        //        if (!existing.TryGetValue(dto.TagId, out var tag))
        //            continue; // or throw if you want strict behavior

        //        tag.ParentTagId = dto.ParentTagId;
        //        tag.TagName = dto.TagName;
        //        tag.BudgetAmount = dto.BudgetAmount;
        //    }

        //    _context.SaveChanges();
        //}
    }
}