using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/v1/code")]
[Authorize]
public class CodeController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CodeExecutionService _executor;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CodeController> _logger;

    public CodeController(
        AppDbContext context,
        CodeExecutionService executor,
        IServiceScopeFactory scopeFactory,
        ILogger<CodeController> logger)
    {
        _context = context;
        _executor = executor;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [HttpPost("execute")]
    public async Task<IActionResult> Execute(ExecuteCodeRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(ApiResponse<object>.Fail("Code cannot be empty"));

        if (!_executor.IsLanguageSupported(request.Language))
            return BadRequest(ApiResponse<object>.Fail($"Unsupported language: {request.Language}"));

        var submission = new CodeSubmission
        {
            UserId = userId,
            Title = request.Title ?? "Untitled",
            Code = request.Code,
            Language = request.Language,
            Input = request.Input,
            Status = "pending"
        };

        _context.CodeSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Submission created: {Id}", submission.Id);

        var submissionId = submission.Id;
        var code = request.Code;
        var language = request.Language;
        var input = request.Input;

        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            try
            {
                var entity = await db.CodeSubmissions.FindAsync(submissionId);
                if (entity is null) return;

                entity.Status = "queued";
                await db.SaveChangesAsync();

                var result = await _executor.ExecuteAsync(code, language, input);

                entity.Output = result.Output;
                entity.Error = result.Error;
                entity.ExecutionTime = result.ExecutionTime;
                entity.Status = result.Success ? "completed" : "failed";
                entity.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();

                _logger.LogInformation("Submission {Id} completed with status: {Status}",
                    submissionId, entity.Status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute code: {Id}", submissionId);
                var entity = await db.CodeSubmissions.FindAsync(submissionId);
                if (entity is not null)
                {
                    entity.Error = ex.Message;
                    entity.Status = "failed";
                    entity.UpdatedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                }
            }
        });

        return StatusCode(202, ApiResponse<ExecutionResultDto>.Ok(new ExecutionResultDto
        {
            SubmissionId = submissionId.ToString(),
            Status = "pending",
            Message = "Code execution queued. Check status using submission ID."
        }, "Code execution started"));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        var userId = GetUserId();

        var query = _context.CodeSubmissions.Where(s => s.UserId == userId);
        var total = await query.CountAsync();

        var submissions = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(s => MapSubmission(s))
            .ToListAsync();

        return Ok(ApiResponse<HistoryResponseData>.Ok(new HistoryResponseData
        {
            Submissions = submissions,
            Pagination = new PaginationDto
            {
                Total = total,
                Page = page,
                Limit = limit,
                Pages = (int)Math.Ceiling((double)total / limit)
            }
        }, "History retrieved successfully"));
    }

    [HttpGet("submissions")]
    public Task<IActionResult> GetSubmissions([FromQuery] int page = 1, [FromQuery] int limit = 10)
        => GetHistory(page, limit);

    [HttpGet("submission/{submissionId}")]
    public async Task<IActionResult> GetSubmission(int submissionId)
    {
        var submission = await _context.CodeSubmissions.FindAsync(submissionId);
        if (submission is null)
            return NotFound(ApiResponse<object>.Fail("Submission not found"));

        return Ok(ApiResponse<SubmissionDto>.Ok(MapSubmission(submission), "Submission retrieved successfully"));
    }

    [HttpGet("stats")]
    public IActionResult GetStats()
    {
        var (active, queued, total) = _executor.GetStats();
        return Ok(ApiResponse<object>.Ok(new
        {
            activeExecutions = active,
            queuedExecutions = queued,
            totalInProgress = total
        }, "Execution statistics"));
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("userId");
        return int.Parse(claim!.Value);
    }

    private static SubmissionDto MapSubmission(CodeSubmission s) => new()
    {
        _id = s.Id.ToString(),
        Title = s.Title,
        Code = s.Code,
        Language = s.Language,
        Input = s.Input,
        Output = s.Output,
        Error = s.Error,
        ExecutionTime = s.ExecutionTime,
        Status = s.Status,
        CreatedAt = s.CreatedAt.ToString("o")
    };
}
