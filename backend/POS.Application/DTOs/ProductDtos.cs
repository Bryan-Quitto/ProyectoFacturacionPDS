namespace POS.Application.DTOs;

public record ProductResponseDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    decimal UnitPrice,
    int StockQuantity,
    decimal TaxRate,
    bool IsActive);
