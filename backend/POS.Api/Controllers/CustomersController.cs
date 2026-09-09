using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    /// <summary>
    /// Searches active customers with pagination (multi-field search by name or identification number).
    /// </summary>
    /// <param name="search">Search query term.</param>
    /// <param name="page">Page index (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Paged list of customer response DTOs.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<CustomerResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<CustomerResponseDto>>> SearchCustomers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _customerService.SearchCustomersAsync(search, page, pageSize, ct);
        return Ok(result);
    }
}
