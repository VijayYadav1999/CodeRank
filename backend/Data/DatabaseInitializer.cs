using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");

        // SQL Server - Users table
        try
        {
            var sqlContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            logger.LogInformation("Checking SQL Server connection...");
            await sqlContext.Database.CanConnectAsync();
            logger.LogInformation("SQL Server connection successful.");

            await CreateUsersTable(sqlContext, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SQL Server initialization failed.");
        }

        // MongoDB - verify connection
        try
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
            logger.LogInformation("Checking MongoDB connection...");
            await mongoContext.Database.CanConnectAsync();
            logger.LogInformation("MongoDB connection successful. Collections are auto-created.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MongoDB initialization failed.");
        }
    }

    private static async Task CreateUsersTable(AppDbContext dbContext, Microsoft.Extensions.Logging.ILogger logger)
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
            logger.LogInformation("Users table ensured.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Users table creation failed.");
        }
    }
}
