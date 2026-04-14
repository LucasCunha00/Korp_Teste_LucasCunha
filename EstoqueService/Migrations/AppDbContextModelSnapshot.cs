using EstoqueService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace EstoqueService.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            modelBuilder.Entity("EstoqueService.Models.Produto", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd()
                    .HasColumnType("integer");
                b.Property<string>("Codigo").IsRequired().HasColumnType("text");
                b.Property<string>("Descricao").IsRequired().HasColumnType("text");
                b.Property<int>("Saldo").HasColumnType("integer");
                b.HasKey("Id");
                b.ToTable("Produtos");
            });
        }
    }
}
