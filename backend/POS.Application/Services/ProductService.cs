using Microsoft.EntityFrameworkCore;
using POS.Application.Common.Interfaces;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;

namespace POS.Application.Services;

public class ProductService : IProductService
{
    private readonly IApplicationDbContext _context;

    public ProductService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<ProductResponseDto>> SearchProductsAsync(
        string? searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : (pageSize > 100 ? 100 : pageSize);

        // Strict filter: only active products with stock > 0
        var query = _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.StockQuantity > 0);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(term) || p.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductResponseDto(
                p.Id,
                p.Code,
                p.Name,
                p.Description,
                p.UnitPrice,
                p.StockQuantity,
                p.TaxRate,
                p.IsActive))
            .ToListAsync(cancellationToken);

        return PagedResultDto<ProductResponseDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
