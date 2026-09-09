using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>
    /// Searches active products with available stock (> 0) with pagination.
    /// </summary>
    /// <param name="search">Search query term (by code or name).</param>
    /// <param name="page">Page index (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Paged list of product response DTOs.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<ProductResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<ProductResponseDto>>> SearchProducts(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _productService.SearchProductsAsync(search, page, pageSize, ct);
        return Ok(result);
    }
}
