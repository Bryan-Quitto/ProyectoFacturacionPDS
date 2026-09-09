namespace POS.Application.DTOs;

public record CustomerResponseDto(
    Guid Id,
    string IdentificationNumber,
    string FullName,
    string Email,
    string Address,
    string PhoneNumber,
    bool IsActive);
