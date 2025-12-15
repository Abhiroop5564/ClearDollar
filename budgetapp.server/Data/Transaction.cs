using System.ComponentModel.DataAnnotations;

namespace BudgetApp.Server
{
    public class Transaction
    {
        [Key]
        public int TransactionId { get; set; }
        public string UserId { get; set; } = string.Empty; // New field
        public DateOnly Date { get; set; }
        public decimal Amount { get; set; }
        public string MerchantDetails { get; set; } = string.Empty;
        public int? TagId { get; set; }
    }
}