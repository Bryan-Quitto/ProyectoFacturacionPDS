namespace POS.Application.DTOs;

public record LoginRequestDto(string Username, string Password);

public record LoginResponseDto(
    string Token,
    Guid UserId,
    string Username,
    string FullName,
    string Role,
    DateTime ExpiresAt);
