namespace backend.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

    public static ApiResponse<T> Ok(T data, string? message = null) => new()
    {
        Success = true,
        Data = data,
        Message = message
    };

    public static ApiResponse<object> Fail(string message, string? error = null) => new()
    {
        Success = false,
        Message = message,
        Error = error
    };
}
