using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using BudgetApp.Server.Controllers;
using BudgetApp.Server.Accessors;
using budgetapp.server.Engines;

namespace BudgetApp.Tests
{
    public class TransactionsControllerTests
    {
        private readonly Mock<ITransactionAccessor> _mockAccessor;
        private readonly Mock<ILogger<TransactionsController>> _mockLogger;
        // Since TransactionEngine is concrete and has no interface in your code, 
        // we pass a dummy one or null if not testing the Upload endpoint here.
        private readonly TransactionEngine _engine; 
        private readonly TransactionsController _controller;

        public TransactionsControllerTests()
        {
            _mockAccessor = new Mock<ITransactionAccessor>();
            _mockLogger = new Mock<ILogger<TransactionsController>>();
            // Engine requires an accessor, we can reuse the mock
            _engine = new TransactionEngine(_mockAccessor.Object);
            
            _controller = new TransactionsController(_mockLogger.Object, _mockAccessor.Object, _engine);
        }

        [Fact]
        public void Get_ShouldReturnTransactions()
        {
            // Arrange
            var userId = "user1";
            var expectedList = new List<BudgetApp.Server.Transaction>();
            _mockAccessor.Setup(a => a.GetAll(userId)).Returns(expectedList);

            // Act
            var result = _controller.Get(userId);

            // Assert
            Assert.Same(expectedList, result);
        }

        [Fact]
        public void UpdateTag_ShouldCallAccessorUpdateTag()
        {
            // Arrange
            var userId = "user1";
            var transactionId = 10;
            var dto = new TransactionsController.UpdateTransactionTagDto(5);

            // Act
            var result = _controller.UpdateTag(transactionId, userId, dto);

            // Assert
            _mockAccessor.Verify(a => a.UpdateTag(userId, transactionId, 5), Times.Once);
            Assert.IsType<OkResult>(result);
        }
    }
}