using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using BudgetApp.Server.Accessors;
using budgetapp.server.Data;

namespace BudgetApp.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly ILogger<TagsController> _logger;
        private readonly ITagAccessor _accessor;

        public TagsController(ILogger<TagsController> logger, ITagAccessor accessor)
        {
            _logger = logger;
            _accessor = accessor;
        }

        // GET /tags?userId=demo-user
        [HttpGet]
        public IEnumerable<Tag> Get(string userId)
        {
            Console.WriteLine($"GET tags for userId: {userId}");
            return _accessor.GetAll(userId);
        }

        // POST /tags?userId=demo-user
        [HttpPost]
        public ActionResult<Tag> Create(string userId, [FromBody] CreateTagRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest("userId is required.");

            if (request == null)
                return BadRequest("Request body is required.");

            var tag = new Tag
            {
                UserId = userId,
                ParentTagId = request.ParentTagId,
                TagName = request.TagName ?? "New Tag",
                BudgetAmount = request.BudgetAmount,
                TagType = request.TagType
            };

            _accessor.Add(userId, tag);

            // returns Tag with real TagId
            return Ok(tag);
        }
    }
}