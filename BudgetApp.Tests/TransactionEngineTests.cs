using Xunit;
using Moq;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using BudgetApp.Server;
using BudgetApp.Server.Accessors;
using budgetapp.server.Engines;
using System;

namespace BudgetApp.Tests
{
    public class TransactionEngineTests
    {
        private readonly Mock<ITransactionAccessor> _mockAccessor;
        private readonly TransactionEngine _engine;

        public TransactionEngineTests()
        {
            _mockAccessor = new Mock<ITransactionAccessor>();
            _engine = new TransactionEngine(_mockAccessor.Object);
        }

        [Fact]
        public async Task ProcessCsvAsync_ShouldParseValidCsvAndAddTransactions()
        {
            // Arrange
            var userId = "test-user";
            var csvContent = "01/15/2025, -100.50, , , Grocery Store\n01/16/2025, 2000.00, , , Paycheck";
            var fileName = "test.csv";
            var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(_ => _.OpenReadStream()).Returns(stream);
            fileMock.Setup(_ => _.FileName).Returns(fileName);
            fileMock.Setup(_ => _.Length).Returns(stream.Length);

            // Act
            await _engine.ProcessCsvAsync(fileMock.Object, userId);

            // Assert
            // Verify Add was called exactly twice
            _mockAccessor.Verify(a => a.Add(userId, It.IsAny<Transaction>()), Times.Exactly(2));

            // Verify content of first transaction
            _mockAccessor.Verify(a => a.Add(userId, It.Is<Transaction>(t => 
                t.Amount == -100.50m && 
                t.MerchantDetails == "Grocery Store" &&
                t.Date == new DateOnly(2025, 1, 15))), Times.Once);
        }

        [Fact]
        public async Task ProcessCsvAsync_ShouldIgnoreEmptyLines()
        {
            // Arrange
            var userId = "test-user";
            var csvContent = "01/15/2025, -50.00, , , Gas\n\n01/16/2025, -20.00, , , Food";
            var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(_ => _.OpenReadStream()).Returns(stream);

            // Act
            await _engine.ProcessCsvAsync(fileMock.Object, userId);

            // Assert
            _mockAccessor.Verify(a => a.Add(userId, It.IsAny<Transaction>()), Times.Exactly(2));
        }
    }
}