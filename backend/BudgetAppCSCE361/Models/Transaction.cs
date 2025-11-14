namespace BudgetAppCSCE361.Models
{
    public class Transaction
    {
        public string Name { get; set; } = "";
        public string Category { get; set; } = "";
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
    }
}
