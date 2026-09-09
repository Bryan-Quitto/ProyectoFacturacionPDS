using Microsoft.EntityFrameworkCore;
using POS.Application.Common.Interfaces;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;
using POS.Domain.Entities;
using POS.Domain.Exceptions;

namespace POS.Application.Services;

public class SaleOrderService : ISaleOrderService
{
    private readonly IApplicationDbContext _context;

    public SaleOrderService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SaleOrderResponseDto> CreateSaleOrderAsync(
        CreateSaleOrderDto dto,
        Guid sellerId,
        CancellationToken cancellationToken = default)
    {
        if (dto == null || dto.Items == null || dto.Items.Count == 0)
        {
            throw new ValidationException("La orden debe contener al menos un producto.");
        }

        if (dto.Items.Select(x => x.ProductId).Distinct().Count() != dto.Items.Count)
        {
            throw new ValidationException("No se permiten productos duplicados en la orden de venta.");
        }

        if (dto.Items.Any(x => x.Quantity <= 0))
        {
            throw new ValidationException("La cantidad de cada producto debe ser mayor a cero.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId, cancellationToken)
            ?? throw new NotFoundException("El cliente especificado no existe.");

        if (!customer.IsActive)
        {
            throw new ValidationException("El cliente especificado no se encuentra activo.");
        }

        var seller = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == sellerId, cancellationToken)
            ?? throw new NotFoundException("El vendedor especificado no existe.");

        if (!seller.IsActive)
        {
            throw new ValidationException("El vendedor especificado no se encuentra activo.");
        }

        var productIds = dto.Items.Select(x => x.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var details = new List<SaleOrderDetail>();
        decimal orderSubtotal = 0m;
        decimal orderTaxAmount = 0m;
        decimal orderTotalAmount = 0m;

        foreach (var item in dto.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                throw new NotFoundException($"Producto con ID '{item.ProductId}' no existe.");
            }

            if (!product.IsActive)
            {
                throw new ValidationException($"El producto '{product.Name}' no está activo.");
            }

            if (product.StockQuantity < item.Quantity)
            {
                throw new InsufficientStockException(product.Name, item.Quantity, product.StockQuantity);
            }

            product.StockQuantity -= item.Quantity;

            decimal subtotal = Math.Round(item.Quantity * product.UnitPrice, 2, MidpointRounding.AwayFromZero);
            decimal taxRate = product.TaxRate;
            decimal taxAmount = Math.Round(subtotal * (taxRate / 100m), 2, MidpointRounding.AwayFromZero);
            decimal total = subtotal + taxAmount;

            orderSubtotal += subtotal;
            orderTaxAmount += taxAmount;
            orderTotalAmount += total;

            var detail = new SaleOrderDetail
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Product = product,
                Quantity = item.Quantity,
                UnitPrice = product.UnitPrice,
                Subtotal = subtotal,
                TaxRate = taxRate,
                TaxAmount = taxAmount,
                Total = total
            };

            details.Add(detail);
        }

        var orderCount = await _context.SaleOrders.CountAsync(cancellationToken);
        var orderNumber = $"FAC-{DateTime.UtcNow:yyyyMMdd}-{(orderCount + 1):D5}";
        while (await _context.SaleOrders.AnyAsync(o => o.OrderNumber == orderNumber, cancellationToken))
        {
            orderCount++;
            orderNumber = $"FAC-{DateTime.UtcNow:yyyyMMdd}-{(orderCount + 1):D5}";
        }

        var saleOrder = new SaleOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            IssueDate = DateTime.UtcNow,
            CustomerId = customer.Id,
            Customer = customer,
            SellerId = seller.Id,
            Seller = seller,
            Subtotal = orderSubtotal,
            TaxAmount = orderTaxAmount,
            TotalAmount = orderTotalAmount,
            CreatedAtUtc = DateTime.UtcNow,
            Details = details
        };

        _context.SaleOrders.Add(saleOrder);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new ConcurrencyConflictException("El stock de uno o más productos fue modificado por otra transacción. Por favor, intente de nuevo.");
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return MapToResponseDto(saleOrder);
    }

    public async Task<SaleOrderResponseDto> GetSaleOrderByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.SaleOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Seller)
            .Include(o => o.Details)
                .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException($"La orden de venta con ID '{id}' no fue encontrada.");
        }

        return MapToResponseDto(order);
    }

    public async Task<PagedResultDto<SaleOrderResponseDto>> SearchSaleOrdersAsync(
        string? searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : (pageSize > 100 ? 100 : pageSize);

        var query = _context.SaleOrders.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(term) ||
                o.Customer.IdentificationNumber.ToLower().Contains(term) ||
                o.Customer.FullName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var orders = await query
            .Include(o => o.Customer)
            .Include(o => o.Seller)
            .Include(o => o.Details)
                .ThenInclude(d => d.Product)
            .OrderByDescending(o => o.IssueDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = orders.Select(MapToResponseDto).ToList();

        return PagedResultDto<SaleOrderResponseDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static SaleOrderResponseDto MapToResponseDto(SaleOrder order)
    {
        var detailsDto = order.Details.Select(d => new SaleOrderDetailResponseDto(
            d.Id,
            d.ProductId,
            d.Product?.Code ?? string.Empty,
            d.Product?.Name ?? string.Empty,
            d.Quantity,
            d.UnitPrice,
            d.Subtotal,
            d.TaxRate,
            d.TaxAmount,
            d.Total
        )).ToList();

        return new SaleOrderResponseDto(
            order.Id,
            order.OrderNumber,
            order.IssueDate,
            order.CustomerId,
            order.Customer?.FullName ?? string.Empty,
            order.Customer?.IdentificationNumber ?? string.Empty,
            order.SellerId,
            order.Seller?.FullName ?? string.Empty,
            order.Subtotal,
            order.TaxAmount,
            order.TotalAmount,
            detailsDto
        );
    }
}
