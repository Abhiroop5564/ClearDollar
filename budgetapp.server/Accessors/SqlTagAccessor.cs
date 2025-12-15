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

        public Tag? GetById(string userId, int tagId)
        {
            return _context.Tags.FirstOrDefault(t => t.UserId == userId && t.TagId == tagId);
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

        public void Update(Tag tag)
        {
            _context.Tags.Update(tag);
            _context.SaveChanges();
        }
    }
}