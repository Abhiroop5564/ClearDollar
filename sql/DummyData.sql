USE BudgetApp;
GO

-- 1. Clean up existing data (Child tables first to avoid Foreign Key errors)
DELETE FROM Transactions;
DELETE FROM Tags;
GO

-- 2. Insert Root Tags (Level 1) - Let DB assign IDs automatically
-- TagType: 1 = Income, 2 = Expense
INSERT INTO Tags (UserId, ParentTagId, TagName, BudgetAmount, TagType) VALUES 
('demo-user', NULL, 'Food', 600.00, 2),
('demo-user', NULL, 'Housing', 1200.00, 2),
('demo-user', NULL, 'Transportation', 300.00, 2),
('demo-user', NULL, 'Entertainment', 200.00, 2);

-- 3. Insert Level 2 Tags (Children)
-- We use subqueries (SELECT TagId ...) to find the ID of the parent dynamically
INSERT INTO Tags (UserId, ParentTagId, TagName, BudgetAmount, TagType) VALUES 
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Food'), 'Groceries', 350.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Food'), 'Restaurants', 250.00, 2),

('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Housing'), 'Rent', 1100.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Housing'), 'Utilities', 100.00, 2),

('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Transportation'), 'Fuel', 220.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Transportation'), 'Parking', 80.00, 2),

('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Entertainment'), 'Streaming', 120.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Entertainment'), 'Events', 80.00, 2);

-- 4. Insert Level 3 Tags (Grandchildren)
INSERT INTO Tags (UserId, ParentTagId, TagName, BudgetAmount, TagType) VALUES 
-- Groceries Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Groceries'), 'Produce', 120.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Groceries'), 'Packaged Goods', 140.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Groceries'), 'Beverages', 90.00, 2),

-- Restaurants Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Restaurants'), 'Fast Food', 120.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Restaurants'), 'Casual Dining', 80.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Restaurants'), 'Fine Dining', 50.00, 2),

-- Rent Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Rent'), 'Base Rent', 1100.00, 2),

-- Utilities Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Utilities'), 'Electric', 45.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Utilities'), 'Water', 30.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Utilities'), 'Gas', 25.00, 2),

-- Fuel Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Fuel'), 'Regular', 160.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Fuel'), 'Premium', 60.00, 2),

-- Parking Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Parking'), 'Street Parking', 30.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Parking'), 'Garage', 50.00, 2),

-- Streaming Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Streaming'), 'Netflix', 50.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Streaming'), 'Hulu', 40.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Streaming'), 'Spotify', 30.00, 2),

-- Events Children
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Events'), 'Movies', 50.00, 2),
('demo-user', (SELECT TagId FROM Tags WHERE TagName = 'Events'), 'Live Show', 30.00, 2);

-- 5. Insert Transactions
-- Transaction Amounts can remain negative for expenses
INSERT INTO Transactions (UserId, Date, Amount, MerchantDetails, TagId) VALUES
('demo-user', DATEADD(day, -1, GETDATE()), -125.50, 'Whole Foods', (SELECT TagId FROM Tags WHERE TagName = 'Produce')),
('demo-user', DATEADD(day, -2, GETDATE()), -45.20, 'Chevron Station', (SELECT TagId FROM Tags WHERE TagName = 'Regular')),
('demo-user', DATEADD(day, -3, GETDATE()), -14.99, 'Netflix Subscription', (SELECT TagId FROM Tags WHERE TagName = 'Netflix')),
('demo-user', DATEADD(day, -4, GETDATE()), -1100.00, 'Apartment Complex', (SELECT TagId FROM Tags WHERE TagName = 'Base Rent')),
('demo-user', DATEADD(day, -5, GETDATE()), -35.00, 'Uber Eats', (SELECT TagId FROM Tags WHERE TagName = 'Fast Food')),
('demo-user', DATEADD(day, -6, GETDATE()), -12.50, 'Starbucks', (SELECT TagId FROM Tags WHERE TagName = 'Beverages')),
('demo-user', DATEADD(day, -10, GETDATE()), -80.00, 'City Parking Garage', (SELECT TagId FROM Tags WHERE TagName = 'Garage')),
('demo-user', DATEADD(day, -12, GETDATE()), -150.00, 'Electric Company', (SELECT TagId FROM Tags WHERE TagName = 'Electric')),
('demo-user', DATEADD(day, -15, GETDATE()), -65.40, 'Trader Joes', (SELECT TagId FROM Tags WHERE TagName = 'Packaged Goods')),
('demo-user', DATEADD(day, -16, GETDATE()), -9.99, 'Spotify Premium', (SELECT TagId FROM Tags WHERE TagName = 'Spotify')),
('demo-user', DATEADD(day, -20, GETDATE()), -200.00, 'Ticketmaster', (SELECT TagId FROM Tags WHERE TagName = 'Live Show')),
('demo-user', DATEADD(day, -25, GETDATE()), -55.00, 'Local Italian Place', (SELECT TagId FROM Tags WHERE TagName = 'Casual Dining')),
('demo-user', DATEADD(day, -28, GETDATE()), -30.00, 'Shell Station', (SELECT TagId FROM Tags WHERE TagName = 'Regular')),
('demo-user', DATEADD(day, -30, GETDATE()), -15.00, 'AMC Theaters', (SELECT TagId FROM Tags WHERE TagName = 'Movies'));

-- 6. Insert Income Tags (Root)
INSERT INTO Tags (UserId, ParentTagId, TagName, BudgetAmount, TagType) VALUES
('demo-user', NULL, 'Paycheck', 3000.00, 1),
('demo-user', NULL, 'Scholarships', 1200.00, 1),
('demo-user', NULL, 'Gifts', 300.00, 1);

-- 7. Insert Income Transactions
INSERT INTO Transactions (UserId, Date, Amount, MerchantDetails, TagId) VALUES
('demo-user', DATEADD(day, -3, GETDATE()), 1500.00, 'Biweekly Paycheck', 
    (SELECT TagId FROM Tags WHERE TagName = 'Paycheck')),

('demo-user', DATEADD(day, -15, GETDATE()), 1200.00, 'Merit Scholarship Disbursement', 
    (SELECT TagId FROM Tags WHERE TagName = 'Scholarships')),

('demo-user', DATEADD(day, -20, GETDATE()), 200.00, 'Birthday Gift', 
    (SELECT TagId FROM Tags WHERE TagName = 'Gifts'));
GO
