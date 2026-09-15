using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.Domain.Entities;

namespace POS.Infrastructure.Persistence.Configurations;

public class SaleOrderDetailConfiguration : IEntityTypeConfiguration<SaleOrderDetail>
{
    public void Configure(EntityTypeBuilder<SaleOrderDetail> builder)
    {
        builder.ToTable("SaleOrderDetails");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Quantity)
            .IsRequired();

        builder.Property(d => d.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(d => d.Subtotal)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(d => d.TaxRate)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(d => d.TaxAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(d => d.Total)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasOne(d => d.SaleOrder)
            .WithMany(o => o.Details)
            .HasForeignKey(d => d.SaleOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Product)
            .WithMany(p => p.SaleOrderDetails)
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_SaleOrderDetail_Quantity_Positive", "\"Quantity\" > 0");
            t.HasCheckConstraint("CK_SaleOrderDetail_Amounts_NonNegative", "\"UnitPrice\" >= 0 AND \"Subtotal\" >= 0 AND \"Total\" >= 0");
        });
    }
}
