namespace POS.Domain.Entities;

public class SaleOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;

    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;

    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<SaleOrderDetail> Details { get; set; } = new List<SaleOrderDetail>();
}
