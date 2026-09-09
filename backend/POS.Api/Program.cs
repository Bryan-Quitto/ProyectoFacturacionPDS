using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;

DotNetEnv.Env.TraversePath().Load();

// QuestPDF community license (must be set before any document is generated)
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Database connection string from environment variable (Single Source of Truth)
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new InvalidOperationException("Missing 'DATABASE_URL' environment variable. Please configure it in .env.");

var connectionString = databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                       databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
    ? BuildNpgsqlConnectionStringFromUri(databaseUrl)
    : databaseUrl;

builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;

// JWT configuration from environment variables
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
var jwtExpirationMinutes = Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES");

builder.Configuration["Jwt:Secret"] = jwtSecret;
builder.Configuration["Jwt:Issuer"] = jwtIssuer;
builder.Configuration["Jwt:Audience"] = jwtAudience;
builder.Configuration["Jwt:ExpirationMinutes"] = jwtExpirationMinutes;

// Business configuration from environment variables
var taxPercentage = Environment.GetEnvironmentVariable("TAX_PERCENTAGE");
builder.Configuration["Business:TaxPercentage"] = taxPercentage;

// JWT authentication
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret ?? string.Empty));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

// CORS policy for the Vite dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add services to the container.
builder.Services.AddDbContext<POS.Infrastructure.Persistence.ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        var scheme = new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.ParameterLocation.Header,
            Description = "Enter JWT token in format: Bearer {token}"
        };

        document.Components ??= new Microsoft.OpenApi.OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, Microsoft.OpenApi.IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = scheme;

        var schemeReference = new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document, null);
        var requirement = new Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [schemeReference] = new List<string>()
        };

        document.Security ??= new List<Microsoft.OpenApi.OpenApiSecurityRequirement>();
        document.Security.Add(requirement);
        return Task.CompletedTask;
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("FrontendPolicy");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply seeds if configured/available
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<POS.Infrastructure.Persistence.ApplicationDbContext>();
    try
    {
        await POS.Infrastructure.Persistence.Seeders.DatabaseSeeder.SeedAsync(dbContext);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Seeding database skipped or failed (e.g. database not migrated yet).");
    }
}

app.Run();
return;

static string BuildNpgsqlConnectionStringFromUri(string uriString)
{
    var uri = new Uri(uriString);
    var userInfo = uri.UserInfo.Split(':');
    var user = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
    var port = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');

    var builder = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = port,
        Database = database,
        Username = user,
        Password = password,
        SslMode = Npgsql.SslMode.Require
    };

    return builder.ConnectionString;
}
