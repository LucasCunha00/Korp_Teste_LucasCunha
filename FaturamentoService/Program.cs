using Microsoft.EntityFrameworkCore;
using FaturamentoService.Data;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddHttpClient<FaturamentoService.Services.EstoqueClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["EstoqueService:BaseUrl"]!);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    for (int i = 0; i < 10; i++)
    {
        try { db.Database.EnsureCreated(); break; }
        catch { if (i == 9) throw; Thread.Sleep(3000); }
    }
}

app.UseCors();
app.MapControllers();
app.Run();