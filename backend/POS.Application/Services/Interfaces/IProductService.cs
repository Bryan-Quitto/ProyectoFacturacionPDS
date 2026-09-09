using POS.Application.DTOs;

namespace POS.Application.Services.Interfaces;

public interface IProductService
{
    Task<PagedResultDto<ProductResponseDto>> SearchProductsAsync(
        string? searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
