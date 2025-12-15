using budgetapp.server.Data;
using Microsoft.EntityFrameworkCore;

namespace BudgetApp.Server.Data
{
    public class BudgetDbContext : DbContext
    {
        public BudgetDbContext(DbContextOptions<BudgetDbContext> options) : base(options)
        {
        }

        public DbSet<Tag> Tags { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
    }
}