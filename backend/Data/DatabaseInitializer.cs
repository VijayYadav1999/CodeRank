using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");

        try
        {
            logger.LogInformation("Checking database connection...");
            await dbContext.Database.CanConnectAsync();
            logger.LogInformation("Database connection successful.");

            var sql = dbContext.Database.GenerateCreateScript();
            logger.LogInformation("Ensuring tables exist...");

            try
            {
                await dbContext.Database.ExecuteSqlRawAsync(
                    @"IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
                      BEGIN
                          " + sql + @"
                      END");
                logger.LogInformation("Database tables ensured.");
            }
            catch (Exception)
            {
                // Tables might partially exist, try EnsureCreated as fallback
                try
                {
                    await dbContext.Database.EnsureCreatedAsync();
                    logger.LogInformation("Database ensured via EnsureCreated.");
                }
                catch (Exception ex2)
                {
                    logger.LogWarning(ex2, "EnsureCreated also failed, trying individual table creation...");
                    await CreateTablesManually(dbContext, logger);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database initialization failed.");
        }
    }

    private static async Task CreateTablesManually(AppDbContext dbContext, Microsoft.Extensions.Logging.ILogger logger)
    {
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
                CREATE TABLE Users (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Email NVARCHAR(255) NOT NULL,
                    Username NVARCHAR(30) NOT NULL,
                    PasswordHash NVARCHAR(MAX) NULL,
                    FirstName NVARCHAR(100) NOT NULL,
                    LastName NVARCHAR(100) NOT NULL,
                    IsGoogleAuth BIT NOT NULL DEFAULT 0,
                    ProfilePicture NVARCHAR(MAX) NULL,
                    Role NVARCHAR(20) NOT NULL DEFAULT 'user',
                    IsActive BIT NOT NULL DEFAULT 1,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                );

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
                CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Username')
                CREATE UNIQUE INDEX IX_Users_Username ON Users(Username);
            ");

            await dbContext.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CodeSubmissions')
                CREATE TABLE CodeSubmissions (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT NOT NULL,
                    Title NVARCHAR(200) NOT NULL,
                    Description NVARCHAR(MAX) NULL,
                    Code NVARCHAR(MAX) NOT NULL,
                    Language NVARCHAR(50) NOT NULL,
                    Input NVARCHAR(MAX) NULL,
                    Output NVARCHAR(MAX) NULL,
                    Error NVARCHAR(MAX) NULL,
                    ExecutionTime BIGINT NOT NULL DEFAULT 0,
                    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    CONSTRAINT FK_CodeSubmissions_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
                );
            ");

            logger.LogInformation("Tables created manually.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Manual table creation failed.");
        }
    }
}
