using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Models;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Controllers;

[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext context, IConfiguration config, ILogger<AuthController> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName))
        {
            return BadRequest(ApiResponse<object>.Fail("All fields are required"));
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
            return Conflict(ApiResponse<object>.Fail("Email or username already exists"));

        var user = new User
        {
            Email = request.Email.ToLower().Trim(),
            Username = request.Username.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim()
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        _logger.LogInformation("User registered: {Email}", user.Email);

        var token = CreateToken(user);
        return StatusCode(201, ApiResponse<AuthResponseData>.Ok(new AuthResponseData
        {
            User = MapUser(user),
            Token = token
        }, "User registered successfully"));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<object>.Fail("Email and password are required"));

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());

        if (user is null || string.IsNullOrEmpty(user.PasswordHash) ||
            !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid credentials"));
        }

        if (!user.IsActive)
            return Unauthorized(ApiResponse<object>.Fail("Account is inactive"));

        _logger.LogInformation("User logged in: {Email}", user.Email);

        var token = CreateToken(user);
        return Ok(ApiResponse<AuthResponseData>.Ok(new AuthResponseData
        {
            User = MapUser(user),
            Token = token
        }, "Login successful"));
    }

    [HttpPost("refresh")]
    public IActionResult Refresh()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        var token = authHeader?.StartsWith("Bearer ") == true ? authHeader[7..] : null;

        if (string.IsNullOrEmpty(token))
            return BadRequest(ApiResponse<object>.Fail("Token required"));

        try
        {
            var principal = ValidateToken(token);
            if (principal is null)
                return Unauthorized(ApiResponse<object>.Fail("Invalid or expired token"));

            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            var role = principal.FindFirst(ClaimTypes.Role)?.Value ?? "user";

            var newToken = GenerateJwt(userId!, email!, role);
            return Ok(ApiResponse<object>.Ok(new { token = newToken }, "Token refreshed"));
        }
        catch
        {
            return Unauthorized(ApiResponse<object>.Fail("Failed to refresh token"));
        }
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleAuth(GoogleAuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GoogleToken))
            return BadRequest(ApiResponse<object>.Fail("Google token is required"));

        var clientId = _config["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            _logger.LogError("Google Client ID is not configured");
            return StatusCode(500, ApiResponse<object>.Fail(
                "Google OAuth is not properly configured on the server. Please contact support."));
        }

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.GoogleToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });

            if (string.IsNullOrEmpty(payload.Email))
                return BadRequest(ApiResponse<object>.Fail("Email not provided by Google"));

            if (!payload.EmailVerified)
                return BadRequest(ApiResponse<object>.Fail("Email not verified by Google"));

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
            var isNewUser = false;

            if (user is null)
            {
                var username = payload.Email.Split('@')[0] + "_" + Random.Shared.Next(1000000, 9999999);
                user = new User
                {
                    Email = payload.Email,
                    Username = username,
                    FirstName = payload.GivenName ?? payload.Name?.Split(' ').FirstOrDefault() ?? "User",
                    LastName = payload.FamilyName ?? payload.Name?.Split(' ').Skip(1).FirstOrDefault() ?? "",
                    ProfilePicture = payload.Picture,
                    IsGoogleAuth = true,
                    IsActive = true
                };

                _context.Users.Add(user);
                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("New user created via Google: {Email}", payload.Email);
                    isNewUser = true;
                }
                catch (DbUpdateException)
                {
                    user.Username = payload.Email.Split('@')[0] + "_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                if (!user.IsActive)
                    return Unauthorized(ApiResponse<object>.Fail("Account is inactive"));

                if (!string.IsNullOrEmpty(payload.Picture) && user.ProfilePicture != payload.Picture)
                {
                    user.ProfilePicture = payload.Picture;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("User logged in via Google: {Email}", payload.Email);
            }

            var token = CreateToken(user);
            return Ok(ApiResponse<AuthResponseData>.Ok(new AuthResponseData
            {
                User = MapUser(user),
                Token = token,
                IsNewUser = isNewUser
            }, isNewUser ? "Account created successfully" : "Login successful"));
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogError(ex, "Google authentication error");
            return Unauthorized(ApiResponse<object>.Fail("Google authentication failed: " + ex.Message));
        }
    }

    private string CreateToken(User user)
    {
        return GenerateJwt(user.Id.ToString(), user.Email, user.Role);
    }

    private string GenerateJwt(string userId, string email, string role)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
        var expiry = _config["Jwt:Expiry"] ?? "7d";

        var expiresAt = expiry.EndsWith('d')
            ? DateTime.UtcNow.AddDays(int.Parse(expiry[..^1]))
            : DateTime.UtcNow.AddHours(8);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim("userId", userId),
                new Claim("email", email),
                new Claim("role", role)
            }),
            Expires = expiresAt,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }

    private ClaimsPrincipal? ValidateToken(string token)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
        var handler = new JwtSecurityTokenHandler();

        try
        {
            return handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out _);
        }
        catch
        {
            return null;
        }
    }

    private static UserDto MapUser(User user) => new()
    {
        Id = user.Id.ToString(),
        Email = user.Email,
        Username = user.Username,
        FirstName = user.FirstName,
        LastName = user.LastName
    };
}
