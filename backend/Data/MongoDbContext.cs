using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;

namespace backend.Data;

public class MongoDbContext : DbContext
{
    public MongoDbContext(DbContextOptions<MongoDbContext> options) : base(options)
    {
    }

    public DbSet<CodeSubmission> CodeSubmissions => Set<CodeSubmission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CodeSubmission>(entity =>
        {
            entity.ToCollection("codesubmissions");
            entity.HasKey(e => e.Id);
        });
    }
}

public class CodeSubmission
{
    public MongoDB.Bson.ObjectId Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "Untitled";
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string? Input { get; set; }
    public string? Output { get; set; }
    public string? Error { get; set; }
    public long ExecutionTime { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
