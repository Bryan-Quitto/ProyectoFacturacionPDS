using Microsoft.Extensions.DependencyInjection;
using POS.Application.Common.Interfaces;
using POS.Infrastructure.Services;

namespace POS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<IInvoicePdfGenerator, QuestPdfInvoiceGenerator>();
        return services;
    }
}
