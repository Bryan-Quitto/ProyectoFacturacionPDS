namespace POS.Application.DTOs;

public record CreateSaleOrderItemDto(Guid ProductId, int Quantity);

public record CreateSaleOrderDto(Guid CustomerId, List<CreateSaleOrderItemDto> Items);

public record SaleOrderDetailResponseDto(
    Guid Id,
    Guid ProductId,
    string ProductCode,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal,
    decimal TaxRate,
    decimal TaxAmount,
    decimal Total);

public record SaleOrderResponseDto(
    Guid Id,
    string OrderNumber,
    DateTime IssueDate,
    Guid CustomerId,
    string CustomerName,
    string CustomerIdentification,
    Guid SellerId,
    string SellerName,
    decimal Subtotal,
    decimal TaxAmount,
    decimal TotalAmount,
    IReadOnlyList<SaleOrderDetailResponseDto> Details,
    string CustomerEmail = "",
    string CustomerAddress = "",
    string CustomerPhoneNumber = "");

