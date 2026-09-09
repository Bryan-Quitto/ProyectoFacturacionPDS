using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using POS.Application.Common.Interfaces;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;
using POS.Domain.Exceptions;

namespace POS.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new ValidationException("Credenciales incorrectas. Verifique su usuario y contraseña.");
        }

        var normalizedUsername = dto.Username.Trim().ToLower();
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername, cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new ValidationException("Credenciales incorrectas. Verifique su usuario y contraseña.");
        }

        if (!user.IsActive)
        {
            throw new ValidationException("El usuario se encuentra inactivo. Contacte al administrador.");
        }

        var jwtSecret = _configuration["Jwt:Secret"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? throw new InvalidOperationException("La clave secreta JWT ('Jwt:Secret') no está configurada.");

        var jwtIssuer = _configuration["Jwt:Issuer"]
            ?? Environment.GetEnvironmentVariable("JWT_ISSUER");

        var jwtAudience = _configuration["Jwt:Audience"]
            ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE");

        var expirationMinutesString = _configuration["Jwt:ExpirationMinutes"]
            ?? Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES");

        var expirationMinutes = int.TryParse(expirationMinutesString, out var parsedMinutes) ? parsedMinutes : 60;
        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, string.IsNullOrWhiteSpace(user.Role) ? "Seller" : user.Role),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return new LoginResponseDto(
            tokenString,
            user.Id,
            user.Username,
            user.FullName,
            user.Role,
            expiresAt);
    }
}
