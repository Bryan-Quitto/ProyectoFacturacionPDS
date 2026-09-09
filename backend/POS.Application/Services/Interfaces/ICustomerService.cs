using POS.Application.DTOs;

namespace POS.Application.Services.Interfaces;

public interface ICustomerService
{
    Task<PagedResultDto<CustomerResponseDto>> SearchCustomersAsync(
        string? searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
