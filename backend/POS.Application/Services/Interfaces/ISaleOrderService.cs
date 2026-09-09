using POS.Application.DTOs;

namespace POS.Application.Services.Interfaces;

public interface ISaleOrderService
{
    Task<SaleOrderResponseDto> CreateSaleOrderAsync(
        CreateSaleOrderDto dto,
        Guid sellerId,
        CancellationToken cancellationToken = default);

    Task<SaleOrderResponseDto> GetSaleOrderByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<PagedResultDto<SaleOrderResponseDto>> SearchSaleOrdersAsync(
        string? searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
