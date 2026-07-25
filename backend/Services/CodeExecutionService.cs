using System.Collections.Concurrent;
using System.Diagnostics;

namespace backend.Services;

public class CodeExecutionService
{
    private readonly string _tempDir;
    private readonly int _maxExecutionTimeMs;
    private readonly ILogger<CodeExecutionService> _logger;
    private readonly SemaphoreSlim _semaphore;
    private readonly ConcurrentDictionary<string, ExecutionInfo> _activeExecutions = new();

    private static readonly Dictionary<string, LanguageConfig> LanguageConfigs = new()
    {
        ["python"] = new LanguageConfig(".py", (file, hasInput) =>
            hasInput ? $"python \"{file}\" < input.txt" : $"python \"{file}\""),
        ["javascript"] = new LanguageConfig(".js", (file, hasInput) =>
            hasInput ? $"node \"{file}\" < input.txt" : $"node \"{file}\""),
        ["cpp"] = new LanguageConfig(".cpp", (file, hasInput) =>
        {
            var execFile = Path.ChangeExtension(file, null);
            var isWindows = OperatingSystem.IsWindows();
            var execCmd = isWindows ? $"\"{execFile}.exe\"" : $"\"{execFile}\"";
            var compile = $"g++ -o \"{execFile}\" \"{file}\"";
            return hasInput
                ? $"{compile} && {execCmd} < input.txt"
                : $"{compile} && {execCmd}";
        })
    };

    public CodeExecutionService(IConfiguration configuration, ILogger<CodeExecutionService> logger)
    {
        _logger = logger;
        _tempDir = Path.Combine(Directory.GetCurrentDirectory(), "temp", "code-execution");
        Directory.CreateDirectory(_tempDir);

        var maxConcurrent = configuration.GetValue("Executor:MaxConcurrentExecutions", 10);
        _maxExecutionTimeMs = configuration.GetValue("Executor:MaxExecutionTimeMs", 30000);
        _semaphore = new SemaphoreSlim(maxConcurrent, maxConcurrent);
    }

    public bool IsLanguageSupported(string language) => LanguageConfigs.ContainsKey(language);

    public (int Active, int Queued, int Total) GetStats() => (
        _activeExecutions.Count,
        Math.Max(0, _activeExecutions.Count - _semaphore.CurrentCount),
        _activeExecutions.Count
    );

    public async Task<ExecutionOutput> ExecuteAsync(string code, string language, string? input)
    {
        var executionId = Guid.NewGuid().ToString();
        var executionDir = Path.Combine(_tempDir, executionId);

        await _semaphore.WaitAsync();
        _activeExecutions[executionId] = new ExecutionInfo("executing", DateTime.UtcNow);

        try
        {
            if (!LanguageConfigs.TryGetValue(language, out var config))
                return new ExecutionOutput("", $"Unsupported language: {language}", 0, false);

            Directory.CreateDirectory(executionDir);

            var codeFile = Path.Combine(executionDir, $"code{config.Extension}");
            await File.WriteAllTextAsync(codeFile, code);

            var hasInput = !string.IsNullOrEmpty(input);
            if (hasInput)
                await File.WriteAllTextAsync(Path.Combine(executionDir, "input.txt"), input);

            var command = config.BuildCommand(codeFile, hasInput);
            var sw = Stopwatch.StartNew();

            var (stdout, stderr, exitCode) = await RunProcessAsync(command, executionDir);
            sw.Stop();

            _logger.LogInformation("Code executed: {Language} ({Time}ms) [ID: {Id}]",
                language, sw.ElapsedMilliseconds, executionId);

            if (!string.IsNullOrEmpty(stderr) && exitCode != 0)
            {
                return new ExecutionOutput(stdout, stderr, sw.ElapsedMilliseconds, false);
            }

            return new ExecutionOutput(stdout, null, sw.ElapsedMilliseconds, true);
        }
        catch (TaskCanceledException)
        {
            return new ExecutionOutput("", $"Execution timeout ({_maxExecutionTimeMs}ms exceeded)", 0, false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Code execution error [ID: {Id}]", executionId);
            return new ExecutionOutput("", ex.Message, 0, false);
        }
        finally
        {
            _activeExecutions.TryRemove(executionId, out _);
            _semaphore.Release();
            Cleanup(executionDir);
        }
    }

    private async Task<(string Stdout, string Stderr, int ExitCode)> RunProcessAsync(
        string command, string workingDir)
    {
        var isWindows = OperatingSystem.IsWindows();
        var psi = new ProcessStartInfo
        {
            FileName = isWindows ? "cmd.exe" : "/bin/sh",
            Arguments = isWindows ? $"/c {command}" : $"-c \"{command.Replace("\"", "\\\"")}\"",
            WorkingDirectory = workingDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = psi };
        using var cts = new CancellationTokenSource(_maxExecutionTimeMs);

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cts.Token);
        var stderrTask = process.StandardError.ReadToEndAsync(cts.Token);

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            throw new TaskCanceledException("Execution timed out");
        }

        return (await stdoutTask, await stderrTask, process.ExitCode);
    }

    private void Cleanup(string dir)
    {
        try
        {
            if (Directory.Exists(dir))
                Directory.Delete(dir, recursive: true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup directory: {Dir}", dir);
        }
    }

    private record LanguageConfig(string Extension, Func<string, bool, string> BuildCommand);
    private record ExecutionInfo(string Status, DateTime StartTime);
}

public record ExecutionOutput(string Output, string? Error, long ExecutionTime, bool Success);
