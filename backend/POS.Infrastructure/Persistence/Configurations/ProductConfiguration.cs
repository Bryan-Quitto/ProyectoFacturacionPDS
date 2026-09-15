using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.Domain.Entities;

namespace POS.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.Code)
            .IsUnique();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Description)
            .HasMaxLength(500);

        builder.Property(p => p.StockQuantity)
            .IsRequired();

        builder.Property(p => p.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.TaxRate)
            .HasPrecision(5, 2)
            .HasDefaultValue(15.00m)
            .IsRequired();

        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.CreatedAtUtc)
            .IsRequired();

        // PostgreSQL concurrency token via xmin system column
        builder.Property(p => p.xmin)
            .IsRowVersion();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Product_StockQuantity_NonNegative", "\"StockQuantity\" >= 0");
            t.HasCheckConstraint("CK_Product_UnitPrice_NonNegative", "\"UnitPrice\" >= 0");
            t.HasCheckConstraint("CK_Product_TaxRate_Range", "\"TaxRate\" >= 0 AND \"TaxRate\" <= 100");
            t.HasCheckConstraint("CK_Product_Code_NotEmpty", "trim(\"Code\") <> ''");
            t.HasCheckConstraint("CK_Product_Name_NotEmpty", "trim(\"Name\") <> ''");
        });
    }
}
