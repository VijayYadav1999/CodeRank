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
            var created = await dbContext.Database.EnsureCreatedAsync();
            if (created)
                logger.LogInformation("Database created successfully.");
            else
                logger.LogInformation("Database already exists.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database initialization failed. Ensure SQL Server is running and the connection string is correct.");
        }
    }
}
