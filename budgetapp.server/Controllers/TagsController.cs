using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using BudgetApp.Server.Accessors;
using budgetapp.server.Data;

namespace BudgetApp.Server.Controllers
{

    public class UpdateTagRequest
    {
        public string? TagName { get; set; }
        public decimal? BudgetAmount { get; set; }
        public TagType? TagType { get; set; } // optional; usually unchanged here
        public int? ParentTagId { get; set; } // optional; for drag-drop if you ever want
    }
    public class CreateTagRequest
    {
        public int? ParentTagId { get; set; }  // null = root
        public string TagName { get; set; } = "New Tag";
        public decimal BudgetAmount { get; set; } = 0m;
        public TagType TagType { get; set; }  // required
    }

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

        // PATCH /tags/{tagId}?userId=demo-user
        [HttpPatch("{tagId:int}")]
        public ActionResult<Tag> Patch(string userId, int tagId, [FromBody] UpdateTagRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest("userId is required.");
            if (request == null)
                return BadRequest("Request body is required.");

            var tag = _accessor.GetById(userId, tagId);
            if (tag == null) return NotFound();

            // Always apply parentTagId (null = root)
            tag.ParentTagId = request.ParentTagId;
            if (request.TagName != null) tag.TagName = request.TagName;
            if (request.BudgetAmount.HasValue) tag.BudgetAmount = request.BudgetAmount.Value;
            if (request.TagType.HasValue) tag.TagType = request.TagType.Value;

            _accessor.Update(tag);
            return Ok(tag);
        }
    }
}