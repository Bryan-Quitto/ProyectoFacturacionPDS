using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services.Interfaces;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Authenticates a seller user and issues a signed JWT token.
    /// </summary>
    /// <param name="dto">Login credentials (username and password).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>JWT token and authenticated user details.</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoginResponseDto>> Login(
        [FromBody] LoginRequestDto dto,
        CancellationToken ct = default)
    {
        var result = await _authService.LoginAsync(dto, ct);
        return Ok(result);
    }
}
