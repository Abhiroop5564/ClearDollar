using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using BudgetAppCSCE361.Services;

var builder = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration(config =>
    {
        config.AddJsonFile("appsettings.json");
    })
    .ConfigureServices((context, services) =>
    {
        services.AddSingleton<PlaidService>();
    })
    .Build();

var plaid = builder.Services.GetRequiredService<PlaidService>();

// Normally you'd exchange a real public token from Plaid Link
string dummyToken = "public-sandbox-123abc";
string accessToken = await plaid.GetAccessTokenAsync(dummyToken);

var transactions = await plaid.GetTransactionsAsync(accessToken, DateTime.UtcNow.AddDays(-30), DateTime.UtcNow);

Console.WriteLine("\nRecent Transactions:");
foreach (var t in transactions)
{
    Console.WriteLine($"{t["date"]}: {t["name"]} — ${t["amount"]}");
}

