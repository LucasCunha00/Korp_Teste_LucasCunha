using Microsoft.EntityFrameworkCore;
using EstoqueService.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    for (int i = 0; i < 10; i++)
    {
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE SCHEMA IF NOT EXISTS estoque;
                CREATE TABLE IF NOT EXISTS estoque.""Produtos"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Codigo"" TEXT NOT NULL,
                    ""Descricao"" TEXT NOT NULL,
                    ""Saldo"" INTEGER NOT NULL
                );
            ");
            break;
        }
        catch
        {
            if (i == 9) throw;
            Thread.Sleep(3000);
        }
    }
}

app.UseCors();
app.MapControllers();
app.Run();