using System.Runtime.CompilerServices;

namespace BudgetApp.Server
{
    public static class MockDB
    {
        private static Dictionary<string, List<Tag>> _tagStore = new();
        private static Dictionary<string, List<Transaction>> _transactionStore = new();

        public static List<Tag> GetTags(string userId)
        {
            Console.WriteLine($"Fetching tags for user: {userId}");
            if (!_tagStore.ContainsKey(userId))
            {
                lock(_tagStore)
                {
                    _tagStore[userId] = GenerateMockTags();
                }
            }
            return _tagStore[userId];
        }

        public static List<Transaction> GetTransactions(string userId)
        {
            Console.WriteLine($"Fetching transactions for user: {userId}");
            if (!_transactionStore.ContainsKey(userId))
            {
                lock(_transactionStore)
                {
                    _transactionStore[userId] = GenerateMockTransactions(GetTags(userId), 20);
                }
            }
            return _transactionStore[userId];
        }

        public static void AddTag(string userId, Tag tag)
        {
            lock(_tagStore)
            {
                _tagStore[userId].Append(tag);
            }
        }

        public static void AddTransaction(string userId, Transaction transaction)
        {
            lock(_transactionStore)
            {
                _transactionStore[userId].Append(transaction);
            }
        }

        public static void SetTags(string userId, List<Tag> tags)
        {
            lock (_tagStore)
            {
                _tagStore[userId] = tags;
            }
           
        }

        public static void SetTransactions(string userId, List<Transaction> transactions)
        {
            lock(_transactionStore)
            {
                _transactionStore[userId] = transactions;
            }
        }

        private static List<Tag> GenerateMockTags()
        {
            // We'll create Tag instances first (without ids), collect parent relationships,
            // then assign unique TagId values and wire ParentTagId to the correct TagId.

            // Primaries
            var food = new Tag { TagName = "Food", BudgetAmount = 600m };
            var housing = new Tag { TagName = "Housing", BudgetAmount = 1200m };
            var transportation = new Tag { TagName = "Transportation", BudgetAmount = 300m };
            var entertainment = new Tag { TagName = "Entertainment", BudgetAmount = 200m };

            // Food subtree
            var groceries = new Tag { TagName = "Groceries", BudgetAmount = 350m };
            var produce = new Tag { TagName = "Produce", BudgetAmount = 120m };
            var packagedGoods = new Tag { TagName = "Packaged Goods", BudgetAmount = 140m };
            var beverages = new Tag { TagName = "Beverages", BudgetAmount = 90m };

            var restaurants = new Tag { TagName = "Restaurants", BudgetAmount = 250m };
            var fastFood = new Tag { TagName = "Fast Food", BudgetAmount = 120m };
            var casualDining = new Tag { TagName = "Casual Dining", BudgetAmount = 80m };
            var fineDining = new Tag { TagName = "Fine Dining", BudgetAmount = 50m };

            // Housing subtree
            var rent = new Tag { TagName = "Rent", BudgetAmount = 1100m };
            var rentBase = new Tag { TagName = "Base", BudgetAmount = 1100m };

            var utilities = new Tag { TagName = "Utilities", BudgetAmount = 100m };
            var electric = new Tag { TagName = "Electric", BudgetAmount = 45m };
            var water = new Tag { TagName = "Water", BudgetAmount = 30m };
            var gas = new Tag { TagName = "Gas", BudgetAmount = 25m };

            // Transportation subtree
            var fuel = new Tag { TagName = "Fuel", BudgetAmount = 220m };
            var regular = new Tag { TagName = "Regular", BudgetAmount = 160m };
            var premium = new Tag { TagName = "Premium", BudgetAmount = 60m };

            var parking = new Tag { TagName = "Parking", BudgetAmount = 80m };
            var street = new Tag { TagName = "Street", BudgetAmount = 30m };
            var garage = new Tag { TagName = "Garage", BudgetAmount = 50m };

            // Entertainment subtree
            var streaming = new Tag { TagName = "Streaming", BudgetAmount = 120m };
            var netflix = new Tag { TagName = "Netflix", BudgetAmount = 50m };
            var hulu = new Tag { TagName = "Hulu", BudgetAmount = 40m };
            var spotify = new Tag { TagName = "Spotify", BudgetAmount = 30m };

            var events = new Tag { TagName = "Events", BudgetAmount = 80m };
            var movies = new Tag { TagName = "Movies", BudgetAmount = 50m };
            var liveShow = new Tag { TagName = "Live Show", BudgetAmount = 30m };

            // Collect child->parent relationships so we can set ParentTagId after IDs are assigned
            var relationships = new List<(Tag child, Tag parent)>
            {
                (groceries, food),
                (produce, groceries),
                (packagedGoods, groceries),
                (beverages, groceries),

                (restaurants, food),
                (fastFood, restaurants),
                (casualDining, restaurants),
                (fineDining, restaurants),

                (rent, housing),
                (rentBase, rent),

                (utilities, housing),
                (electric, utilities),
                (water, utilities),
                (gas, utilities),

                (fuel, transportation),
                (regular, fuel),
                (premium, fuel),

                (parking, transportation),
                (street, parking),
                (garage, parking),

                (streaming, entertainment),
                (netflix, streaming),
                (hulu, streaming),
                (spotify, streaming),

                (events, entertainment),
                (movies, events),
                (liveShow, events)
            };

            // Child tags must be added after parents in the returned list for readability / potential UI ordering.
            var tags = new List<Tag>
            {
                // Primaries
                food, housing, transportation, entertainment,

                // Food subtree
                groceries, produce, packagedGoods, beverages,
                restaurants, fastFood, casualDining, fineDining,

                // Housing subtree
                rent, rentBase, utilities, electric, water, gas,

                // Transportation subtree
                fuel, regular, premium, parking, street, garage,

                // Entertainment subtree
                streaming, netflix, hulu, spotify, events, movies, liveShow
            };

            // Assign unique TagId values
            var nextId = 1;
            foreach (var t in tags)
            {
                t.TagId = nextId++;
            }

            // Wire ParentTagId using assigned TagId values
            foreach (var (child, parent) in relationships)
            {
                child.ParentTagId = parent.TagId;
            }

            return tags;
        }

        private static List<Transaction> GenerateMockTransactions(List<Tag> tagPool,int count)
        {
            var rng = new Random();
            var transactions = new List<Transaction>();

            for (int i = 0; i < count; i++)
            {
                // date within last 90 days
                var daysAgo = rng.Next(0, 90);
                var date = DateOnly.FromDateTime(DateTime.Now.AddDays(-daysAgo));

                // Hard Coded String for merchant details
                var merchant = "Merchant Details Here";

                // Varied amount: small everyday purchases and occasional larger ones
                decimal amount = Math.Round((decimal)(rng.NextDouble() * 150), 2);


                // Assign a tag most of the time, using existing tag instances

                int? tagId = null;
                if (tagPool.Count > 0 && rng.NextDouble() < 0.85)
                {
                    Tag tag = tagPool[rng.Next(tagPool.Count)];
                    tagId = tag.TagId;
                }

                transactions.Add(new Transaction
                {
                    TransactionId = (i+1),
                    Date = date,
                    MerchantDetails = merchant,
                    Amount = amount,
                    TagId = tagId
                });
            }

            return transactions;
        }

    }

}
