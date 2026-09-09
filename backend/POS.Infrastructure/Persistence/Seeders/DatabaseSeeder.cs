using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using POS.Domain.Entities;

namespace POS.Infrastructure.Persistence.Seeders;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // 1. Seed Seller User
        if (!await context.Users.AnyAsync())
        {
            var seller = new User
            {
                Id = Guid.NewGuid(),
                Username = "seller1",
                Email = "seller1@pos.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Seller123*"),
                FullName = "Default Seller",
                Role = "Seller",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            await context.Users.AddAsync(seller);
        }

        // 2. Seed Ecuadorian Customers
        if (!await context.Customers.AnyAsync())
        {
            var customers = new List<Customer>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    IdentificationNumber = "1710034065",
                    FullName = "Carlos Perez (Consumidor Final)",
                    Email = "carlos.perez@example.com",
                    Address = "Av. Amazonas y Naciones Unidas, Quito",
                    PhoneNumber = "0991234567",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IdentificationNumber = "0923456789",
                    FullName = "Maria Rodriguez",
                    Email = "maria.rodriguez@example.com",
                    Address = "Av. 9 de Octubre y Malecon, Guayaquil",
                    PhoneNumber = "0987654321",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IdentificationNumber = "1803456781",
                    FullName = "Juan Lopez",
                    Email = "juan.lopez@example.com",
                    Address = "Calle Cevallos y Montalvo, Ambato",
                    PhoneNumber = "0978912345",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };

            await context.Customers.AddRangeAsync(customers);
        }

        // 3. Seed Products (4 with Stock > 0, 1 with Stock = 0)
        if (!await context.Products.AnyAsync())
        {
            var products = new List<Product>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Code = "PRD-001",
                    Name = "Teclado Mecanico RGB",
                    Description = "Teclado mecanico switch azul con retroiluminacion RGB",
                    UnitPrice = 45.00m,
                    StockQuantity = 25,
                    TaxRate = 15.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Code = "PRD-002",
                    Name = "Mouse Inalambrico Ergonomico",
                    Description = "Mouse optico inalambrico 2.4GHz recargable",
                    UnitPrice = 22.50m,
                    StockQuantity = 40,
                    TaxRate = 15.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Code = "PRD-003",
                    Name = "Monitor Gamer 24 IPS 144Hz",
                    Description = "Monitor FullHD 1080p 1ms FreeSync compatible",
                    UnitPrice = 180.00m,
                    StockQuantity = 10,
                    TaxRate = 15.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Code = "PRD-004",
                    Name = "Cable HDMI 2.1 Ultra HD 4K/8K",
                    Description = "Cable mallado de alta velocidad 2 metros",
                    UnitPrice = 8.00m,
                    StockQuantity = 100,
                    TaxRate = 15.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Code = "PRD-005",
                    Name = "Memoria RAM DDR4 16GB 3200MHz",
                    Description = "Modulo de memoria RAM para PC de escritorio",
                    UnitPrice = 55.00m,
                    StockQuantity = 0, // Out of stock for validation testing (Req. 8)
                    TaxRate = 15.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };

            await context.Products.AddRangeAsync(products);
        }

        await context.SaveChangesAsync();
    }
}
