using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.Domain.Entities;

namespace POS.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.IdentificationNumber)
            .IsRequired()
            .HasMaxLength(13);

        builder.HasIndex(c => c.IdentificationNumber)
            .IsUnique();

        builder.Property(c => c.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Address)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(c => c.PhoneNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(c => c.CreatedAtUtc)
            .IsRequired();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Customer_PhoneNumber_DigitsOnly", "\"PhoneNumber\" ~ '^[0-9]{7,15}$'");
            t.HasCheckConstraint("CK_Customer_Identification_DigitsOnly", "\"IdentificationNumber\" ~ '^[0-9]{10,13}$'");
            t.HasCheckConstraint("CK_Customer_Email_Format", "\"Email\" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'");
            t.HasCheckConstraint("CK_Customer_FullName_NotEmpty", "trim(\"FullName\") <> ''");
            t.HasCheckConstraint("CK_Customer_Address_NotEmpty", "trim(\"Address\") <> ''");
        });
    }
}
