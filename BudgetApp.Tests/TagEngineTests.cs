using Xunit;
using System.Collections.Generic;
using BudgetApp.Server.Engines;
using budgetapp.server.Data;

namespace BudgetApp.Tests
{
    public class TagEngineTests
    {
        private readonly TagEngine _engine;

        public TagEngineTests()
        {
            _engine = new TagEngine();
        }

        [Fact]
        public void ValidateBudgetHierarchy_ShouldReturnError_WhenChildrenExceedParent()
        {
            // Arrange
            var tags = new List<Tag>
            {
                // Parent has $100
                new Tag { TagId = 1, TagName = "Food", BudgetAmount = 100, ParentTagId = null },
                
                // Children sum to $110 ($60 + $50)
                new Tag { TagId = 2, TagName = "Groceries", BudgetAmount = 60, ParentTagId = 1 },
                new Tag { TagId = 3, TagName = "Dining Out", BudgetAmount = 50, ParentTagId = 1 }
            };

            // Act
            var errors = _engine.ValidateBudgetHierarchy(tags);

            // Assert
            Assert.NotEmpty(errors);
            Assert.Single(errors); // Should be exactly one error
            Assert.Contains("Food", errors[0]); // Error should mention the parent name
            Assert.Contains("children sum to $110.00", errors[0]);
        }

        [Fact]
        public void ValidateBudgetHierarchy_ShouldPass_WhenChildrenEqualParent()
        {
            // Arrange
            var tags = new List<Tag>
            {
                new Tag { TagId = 1, TagName = "Rent", BudgetAmount = 1000, ParentTagId = null },
                new Tag { TagId = 2, TagName = "Base Rent", BudgetAmount = 1000, ParentTagId = 1 }
            };

            // Act
            var errors = _engine.ValidateBudgetHierarchy(tags);

            // Assert
            Assert.Empty(errors);
        }

        [Fact]
        public void ValidateBudgetHierarchy_ShouldPass_WhenChildrenAreLessThanParent()
        {
            // Arrange
            var tags = new List<Tag>
            {
                new Tag { TagId = 1, TagName = "Savings", BudgetAmount = 500, ParentTagId = null },
                new Tag { TagId = 2, TagName = "Emergency Fund", BudgetAmount = 100, ParentTagId = 1 }
                // Remaining $400 is unallocated, which is valid
            };

            // Act
            var errors = _engine.ValidateBudgetHierarchy(tags);

            // Assert
            Assert.Empty(errors);
        }

        [Fact]
        public void ValidateBudgetHierarchy_ShouldHandleMultipleLevels()
        {
            // Arrange
            var tags = new List<Tag>
            {
                // Root: $100
                new Tag { TagId = 1, TagName = "Root", BudgetAmount = 100, ParentTagId = null },
                
                // Child: $120 (Invalid vs Root)
                new Tag { TagId = 2, TagName = "Child", BudgetAmount = 120, ParentTagId = 1 },

                // GrandChild: $130 (Invalid vs Child)
                new Tag { TagId = 3, TagName = "GrandChild", BudgetAmount = 130, ParentTagId = 2 }
            };

            // Act
            var errors = _engine.ValidateBudgetHierarchy(tags);

            // Assert
            Assert.Equal(2, errors.Count); // Should fail for Root AND Child
        }
    }
}
