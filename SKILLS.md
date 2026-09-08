# OPERATIONAL SKILLS & IMPLEMENTATION RECIPES

## SKILL 1: ECUADORIAN ID VALIDATION (MÓDULO 10)

### C# Implementation (POS.Application / Services)
```csharp
public static class EcuadorianIdentityValidator
{
    public static bool ValidateCedula(string? id)
    {
        if (string.IsNullOrWhiteSpace(id) || id.Length != 10 || !id.All(char.IsDigit))
            return false;

        int province = int.Parse(id[..2]);
        if (province < 1 || province > 24) return false;

        int thirdDigit = int.Parse(id[2].ToString());
        if (thirdDigit >= 6) return false;

        int[] coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        int sum = 0;

        for (int i = 0; i < 9; i++)
        {
            int val = int.Parse(id[i].ToString()) * coefficients[i];
            sum += val >= 10 ? val - 9 : val;
        }

        int verifier = int.Parse(id[9].ToString());
        int calculated = (sum % 10 == 0) ? 0 : 10 - (sum % 10);

        return calculated == verifier;
    }
}

```

### TypeScript / Zod Bridge (Frontend)

```typescript
export const cedulaSchema = z.string().refine((val) => {
  if (!/^\d{10}$/.test(val)) return false;
  const province = parseInt(val.substring(0, 2), 10);
  if (province < 1 || province > 24) return false;
  if (parseInt(val[2], 10) >= 6) return false;

  const coefs = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let result = parseInt(val[i], 10) * coefs[i];
    sum += result >= 10 ? result - 9 : result;
  }
  const verifier = parseInt(val[9], 10);
  const calculated = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return calculated === verifier;
}, { message: "Número de cédula ecuatoriana no válido" });

```

---

## SKILL 2: CONCURRENCY & TRANSACTION WORKFLOW

### EF Core Entity Configuration

```csharp
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(150);
        builder.Property(p => p.StockQuantity).IsRequired();
        builder.Property(p => p.UnitPrice).HasPrecision(18, 2);

        // PostgreSQL concurrency token via xmin system column
        builder.UseXminAsConcurrencyToken();

        builder.ToTable(t => t.HasCheckConstraint("CK_Product_StockQuantity_NonNegative", "\"StockQuantity\" >= 0"));
    }
}

```

### Sale Processing in Application Layer

```csharp
public async Task<SaleOrderResponseDto> CreateSaleOrderAsync(CreateSaleOrderRequestDto request, CancellationToken ct)
{
    await using var transaction = await _context.Database.BeginTransactionAsync(ct);
    try
    {
        var customer = await _context.Customers.FindAsync([request.CustomerId], ct)
            ?? throw new NotFoundException("El cliente especificado no existe.");

        var productIds = request.Details.Select(d => d.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        var saleOrder = new SaleOrder
        {
            CustomerId = customer.Id,
            CreatedAtUtc = DateTime.UtcNow,
            OrderNumber = GenerateOrderNumber()
        };

        decimal subtotal = 0m;

        foreach (var item in request.Details)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
                throw new BadRequestException($"Producto con ID {item.ProductId} no existe.");

            if (product.StockQuantity < item.Quantity)
                throw new BadRequestException($"Stock insuficiente para '{product.Name}'. Disponible: {product.StockQuantity}.");

            product.StockQuantity -= item.Quantity; // Decrement stock

            var lineTotal = product.UnitPrice * item.Quantity;
            subtotal += lineTotal;

            saleOrder.Details.Add(new SaleOrderDetail
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.UnitPrice,
                Subtotal = lineTotal
            });
        }

        decimal tax = Math.Round(subtotal * 0.15m, 2); // 15% IVA Ecuador
        saleOrder.Subtotal = subtotal;
        saleOrder.TaxAmount = tax;
        saleOrder.TotalAmount = subtotal + tax;

        _context.SaleOrders.Add(saleOrder);
        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return _mapper.Map<SaleOrderResponseDto>(saleOrder);
    }
    catch (DbUpdateConcurrencyException)
    {
        await transaction.RollbackAsync(ct);
        throw new ConflictException("Conflicto de concurrencia: el stock de uno o más productos fue modificado por otra transacción. Actualice el catálogo e intente nuevamente.");
    }
    catch
    {
        await transaction.RollbackAsync(ct);
        throw;
    }
}

```

---

## SKILL 3: SMART SEARCH & PAGINATION CONTROLLER

```csharp
[ApiController]
[Route("api/v1/products")]
public class ProductsController(IProductService productService) : ControllerBase
{
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResultDto<ProductLookupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? query, 
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10, 
        CancellationToken ct = default)
    {
        // Enforce stock > 0 and 2-field search (Code or Name)
        var result = await productService.SearchInStockProductsAsync(query, pageNumber, pageSize, ct);
        return Ok(result);
    }
}

```

### Frontend Debounce Search Hook Pattern

```typescript
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

```

---

## SKILL 4: PDF INVOICE GENERATION (QUESTPDF)

```csharp
public class InvoiceDocument(SaleOrder order) : IDocument
{
    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(30);
            page.Header().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("PUNTO DE VENTA").Bold().FontSize(18);
                    col.Item().Text($"Factura N°: {order.OrderNumber}").FontSize(11);
                    col.Item().Text($"Fecha: {order.CreatedAtUtc:yyyy-MM-dd HH:mm}").FontSize(10);
                });
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text($"Cliente: {order.Customer.FullName}").Bold();
                    col.Item().Text($"Cédula/RUC: {order.Customer.IdentityNumber}");
                    col.Item().Text($"Email: {order.Customer.Email}");
                });
            });

            page.Content().PaddingVertical(15).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(3); // Descripción
                    cols.RelativeColumn(1); // Cantidad
                    cols.RelativeColumn(1); // Precio Unitario
                    cols.RelativeColumn(1); // Subtotal
                });

                table.Header(header =>
                {
                    header.Cell().Text("Descripción").Bold();
                    header.Cell().Text("Cantidad").Bold();
                    header.Cell().Text("P. Unitario").Bold();
                    header.Cell().Text("Total").Bold();
                });

                foreach (var item in order.Details)
                {
                    table.Cell().Text(item.Product.Name);
                    table.Cell().Text(item.Quantity.ToString());
                    table.Cell().Text($"${item.UnitPrice:F2}");
                    table.Cell().Text($"${item.Subtotal:F2}");
                }
            });

            page.Footer().AlignRight().Column(col =>
            {
                col.Item().Text($"Subtotal: ${order.Subtotal:F2}");
                col.Item().Text($"IVA (15\%): ${order.TaxAmount:F2}");
                col.Item().Text($"Total a Pagar: ${order.TotalAmount:F2}").Bold().FontSize(12);
            });
        });
    }
}