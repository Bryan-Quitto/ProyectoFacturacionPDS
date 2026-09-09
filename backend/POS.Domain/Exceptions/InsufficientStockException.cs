namespace POS.Domain.Exceptions;

public class InsufficientStockException : ValidationException
{
    public string ProductName { get; }
    public int RequestedQuantity { get; }
    public int AvailableStock { get; }

    public InsufficientStockException(string productName, int requestedQuantity, int availableStock)
        : base($"Stock insuficiente para el producto '{productName}'. Solicitado: {requestedQuantity}, Disponible: {availableStock}")
    {
        ProductName = productName;
        RequestedQuantity = requestedQuantity;
        AvailableStock = availableStock;
    }
}
