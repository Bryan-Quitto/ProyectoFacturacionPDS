using POS.Application.DTOs;

namespace POS.Application.Common.Interfaces;

public interface IInvoicePdfGenerator
{
    byte[] GenerateInvoicePdf(SaleOrderResponseDto saleOrder);
}
