namespace backend.Models;

public class ExecuteCodeRequest
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string? Input { get; set; }
    public string? Title { get; set; }
}

public class ExecutionResultDto
{
    public string SubmissionId { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string? Message { get; set; }
}

public class SubmissionDto
{
    public string _id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string? Input { get; set; }
    public string? Output { get; set; }
    public string? Error { get; set; }
    public long ExecutionTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class PaginationDto
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Pages { get; set; }
}

public class HistoryResponseData
{
    public List<SubmissionDto> Submissions { get; set; } = new();
    public PaginationDto Pagination { get; set; } = new();
}
