using Microsoft.EntityFrameworkCore;
using POS.Application.Common.Interfaces;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;

namespace POS.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly IApplicationDbContext _context;

    public CustomerService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<CustomerResponseDto>> SearchCustomersAsync(
        string? searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : (pageSize > 100 ? 100 : pageSize);

        var query = _context.Customers
            .AsNoTracking()
            .Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(c => c.IdentificationNumber.ToLower().Contains(term) || c.FullName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.FullName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerResponseDto(
                c.Id,
                c.IdentificationNumber,
                c.FullName,
                c.Email,
                c.Address,
                c.PhoneNumber,
                c.IsActive))
            .ToListAsync(cancellationToken);

        return PagedResultDto<CustomerResponseDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
