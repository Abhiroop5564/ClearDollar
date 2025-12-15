using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using BudgetApp.Server.Controllers;
using BudgetApp.Server.Accessors;
using budgetapp.server.Data;

namespace BudgetApp.Tests
{
    public class TagsControllerTests
    {
        private readonly Mock<ITagAccessor> _mockAccessor;
        private readonly Mock<ILogger<TagsController>> _mockLogger;
        private readonly TagsController _controller;

        public TagsControllerTests()
        {
            _mockAccessor = new Mock<ITagAccessor>();
            _mockLogger = new Mock<ILogger<TagsController>>();
            _controller = new TagsController(_mockLogger.Object, _mockAccessor.Object);
        }

        [Fact]
        public void Get_ShouldReturnAllTagsForUser()
        {
            // Arrange
            var userId = "user1";
            var expectedTags = new List<Tag> { new Tag { TagId = 1, TagName = "Food" } };
            _mockAccessor.Setup(a => a.GetAll(userId)).Returns(expectedTags);

            // Act
            var result = _controller.Get(userId);

            // Assert
            Assert.Equal(expectedTags, result);
        }

        [Fact]
        public void Create_ShouldReturnBadRequest_WhenUserIdMissing()
        {
            // Act
            var result = _controller.Create("", new CreateTagRequest { TagName = "Test" });

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("userId is required.", badRequest.Value);
        }

        [Fact]
        public void Create_ShouldCallAdd_AndReturnOk()
        {
            // Arrange
            var userId = "user1";
            var request = new CreateTagRequest { TagName = "Rent", BudgetAmount = 1000, TagType = TagType.Expense };

            // Act
            var result = _controller.Create(userId, request);

            // Assert
            _mockAccessor.Verify(a => a.Add(userId, It.Is<Tag>(t => t.TagName == "Rent" && t.UserId == userId)), Times.Once);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void Patch_ShouldReturnNotFound_WhenTagDoesNotExist()
        {
            // Arrange
            var userId = "user1";
            var tagId = 99;
            _mockAccessor.Setup(a => a.GetById(userId, tagId)).Returns((Tag?)null);

            // Act
            var result = _controller.Patch(userId, tagId, new UpdateTagRequest());

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public void Patch_ShouldUpdateFields_AndCallUpdate()
        {
            // Arrange
            var userId = "user1";
            var tagId = 1;
            var existingTag = new Tag { TagId = 1, UserId = userId, TagName = "Old Name", BudgetAmount = 50 };
            
            _mockAccessor.Setup(a => a.GetById(userId, tagId)).Returns(existingTag);

            var request = new UpdateTagRequest { TagName = "New Name", BudgetAmount = 100 };

            // Act
            var result = _controller.Patch(userId, tagId, request);

            // Assert
            Assert.Equal("New Name", existingTag.TagName);
            Assert.Equal(100, existingTag.BudgetAmount);
            _mockAccessor.Verify(a => a.Update(existingTag), Times.Once);
            Assert.IsType<OkObjectResult>(result.Result);
        }
    }
}