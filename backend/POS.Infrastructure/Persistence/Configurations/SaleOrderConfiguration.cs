using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.Domain.Entities;

namespace POS.Infrastructure.Persistence.Configurations;

public class SaleOrderConfiguration : IEntityTypeConfiguration<SaleOrder>
{
    public void Configure(EntityTypeBuilder<SaleOrder> builder)
    {
        builder.ToTable("SaleOrders");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(o => o.OrderNumber)
            .IsUnique();

        builder.Property(o => o.IssueDate)
            .IsRequired();

        builder.Property(o => o.Subtotal)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(o => o.TaxAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(o => o.TotalAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(o => o.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(o => o.Customer)
            .WithMany(c => c.SaleOrders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Seller)
            .WithMany(u => u.SaleOrders)
            .HasForeignKey(o => o.SellerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
