using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Common.Interfaces;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/v1/sale-orders")]
[Authorize]
public class SaleOrdersController : ControllerBase
{
    private readonly ISaleOrderService _saleOrderService;
    private readonly IInvoicePdfGenerator _invoicePdfGenerator;

    public SaleOrdersController(
        ISaleOrderService saleOrderService,
        IInvoicePdfGenerator invoicePdfGenerator)
    {
        _saleOrderService = saleOrderService;
        _invoicePdfGenerator = invoicePdfGenerator;
    }

    /// <summary>
    /// Creates a new sale order within an ACID transaction and atomically decrements product stock.
    /// The seller identity is extracted directly from the authenticated JWT claims.
    /// </summary>
    /// <param name="dto">The sale order items and customer information.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The created sale order with full detail breakdown.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(SaleOrderResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SaleOrderResponseDto>> Create(
        [FromBody] CreateSaleOrderDto dto,
        CancellationToken ct = default)
    {
        var sellerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sellerIdClaim) || !Guid.TryParse(sellerIdClaim, out var sellerId))
        {
            throw new UnauthorizedAccessException("Identificador de usuario inválido en el token de autenticación.");
        }

        var result = await _saleOrderService.CreateSaleOrderAsync(dto, sellerId, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Retrieves a single sale order by its unique identifier.
    /// </summary>
    /// <param name="id">The sale order GUID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The detailed sale order response DTO.</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SaleOrderResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleOrderResponseDto>> GetById(
        [FromRoute] Guid id,
        CancellationToken ct = default)
    {
        var result = await _saleOrderService.GetSaleOrderByIdAsync(id, ct);
        return Ok(result);
    }

    /// <summary>
    /// Searches and filters historical sale orders with pagination (by order number or customer name/identification).
    /// </summary>
    /// <param name="search">Search query term.</param>
    /// <param name="page">Page index (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Paged list of sale order response DTOs.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<SaleOrderResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<SaleOrderResponseDto>>> Search(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _saleOrderService.SearchSaleOrdersAsync(search, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>
    /// Generates and streams an invoice document as a downloadable PDF file via QuestPDF.
    /// </summary>
    /// <param name="id">The sale order GUID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The generated PDF document stream.</returns>
    [HttpGet("{id:guid}/pdf")]
    [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK, "application/pdf")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadPdf(
        [FromRoute] Guid id,
        CancellationToken ct = default)
    {
        var order = await _saleOrderService.GetSaleOrderByIdAsync(id, ct);
        var pdfBytes = _invoicePdfGenerator.GenerateInvoicePdf(order);
        var fileName = $"Factura-{order.OrderNumber}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }
}
