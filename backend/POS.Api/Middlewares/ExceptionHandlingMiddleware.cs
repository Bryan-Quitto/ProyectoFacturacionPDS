using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.Domain.Exceptions;

namespace POS.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate _next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        this._next = _next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var problemDetails = CreateProblemDetails(context, exception);

        if (problemDetails.Status >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception occurred on path {Path}", context.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception, "Handled exception {ExceptionType} with status {StatusCode} on path {Path}: {Message}",
                exception.GetType().Name, problemDetails.Status, context.Request.Path, exception.Message);
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        await JsonSerializer.SerializeAsync(context.Response.Body, problemDetails, jsonOptions);
    }

    private ProblemDetails CreateProblemDetails(HttpContext context, Exception exception)
    {
        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path,
            Type = $"https://httpstatuses.com/"
        };

        switch (exception)
        {
            case InsufficientStockException stockEx:
                problemDetails.Status = StatusCodes.Status400BadRequest;
                problemDetails.Title = "Stock insuficiente";
                problemDetails.Detail = stockEx.Message;
                problemDetails.Type = "https://httpstatuses.com/400";
                problemDetails.Extensions["productName"] = stockEx.ProductName;
                problemDetails.Extensions["requestedQuantity"] = stockEx.RequestedQuantity;
                problemDetails.Extensions["availableStock"] = stockEx.AvailableStock;
                break;

            case ValidationException valEx:
                problemDetails.Status = StatusCodes.Status400BadRequest;
                problemDetails.Title = "Error de validación";
                problemDetails.Detail = valEx.Message;
                problemDetails.Type = "https://httpstatuses.com/400";
                break;

            case NotFoundException notFoundEx:
                problemDetails.Status = StatusCodes.Status404NotFound;
                problemDetails.Title = "Recurso no encontrado";
                problemDetails.Detail = notFoundEx.Message;
                problemDetails.Type = "https://httpstatuses.com/404";
                break;

            case ConcurrencyConflictException concEx:
                problemDetails.Status = StatusCodes.Status409Conflict;
                problemDetails.Title = "Conflicto de concurrencia";
                problemDetails.Detail = concEx.Message;
                problemDetails.Type = "https://httpstatuses.com/409";
                break;

            case DbUpdateConcurrencyException:
                problemDetails.Status = StatusCodes.Status409Conflict;
                problemDetails.Title = "Conflicto de concurrencia";
                problemDetails.Detail = "El inventario o registro fue modificado por otra transacción concurrente. Por favor, recargue e intente nuevamente.";
                problemDetails.Type = "https://httpstatuses.com/409";
                break;

            case UnauthorizedAccessException authEx:
                problemDetails.Status = StatusCodes.Status401Unauthorized;
                problemDetails.Title = "No autorizado";
                problemDetails.Detail = authEx.Message;
                problemDetails.Type = "https://httpstatuses.com/401";
                break;

            default:
                problemDetails.Status = StatusCodes.Status500InternalServerError;
                problemDetails.Title = "Error interno del servidor";
                problemDetails.Detail = _environment.IsDevelopment()
                    ? $"{exception.Message}\n{exception.StackTrace}"
                    : "Ha ocurrido un error interno en el servidor. Por favor, contacte al administrador.";
                problemDetails.Type = "https://httpstatuses.com/500";
                break;
        }

        return problemDetails;
    }
}
