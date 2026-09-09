using Microsoft.Extensions.DependencyInjection;
using POS.Application.Services;
using POS.Application.Services.Interfaces;

namespace POS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ISaleOrderService, SaleOrderService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
