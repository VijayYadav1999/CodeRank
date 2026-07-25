using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured. Set it via environment variable or appsettings.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    }));

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured. Set it via environment variable or appsettings.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<CodeExecutionService>();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

var allowedOrigins = (builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:4200")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseCors("frontend");

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = 500;
        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var msg = error?.Error?.Message ?? "Unknown error";
        var inner = error?.Error?.InnerException?.Message;
        await context.Response.WriteAsJsonAsync(new
        {
            success = false,
            message = msg,
            innerError = inner,
            timestamp = DateTime.UtcNow.ToString("o")
        });
    });
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    success = true,
    data = new
    {
        message = "CodeRank API Server",
        version = "1.0.0",
        status = "running",
        endpoints = new
        {
            health = "/health",
            auth = "/api/v1/auth",
            code = "/api/v1/code"
        }
    },
    timestamp = DateTime.UtcNow.ToString("o")
}));

app.MapGet("/health", () => Results.Ok(new
{
    success = true,
    data = new { status = "ok" },
    timestamp = DateTime.UtcNow.ToString("o")
}));

app.MapControllers();

await DatabaseInitializer.InitializeAsync(app.Services);

app.Run();
