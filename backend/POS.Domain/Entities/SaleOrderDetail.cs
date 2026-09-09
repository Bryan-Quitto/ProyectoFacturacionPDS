namespace POS.Domain.Entities;

public class SaleOrderDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SaleOrderId { get; set; }
    public SaleOrder SaleOrder { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
}
