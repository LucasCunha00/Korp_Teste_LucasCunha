using FaturamentoService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace FaturamentoService.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            modelBuilder.Entity("FaturamentoService.Models.NotaFiscal", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer");
                b.Property<int>("Numeracao").HasColumnType("integer");
                b.Property<string>("Status").IsRequired().HasColumnType("text");
                b.Property<DateTime>("CriadaEm").HasColumnType("timestamp with time zone");
                b.HasKey("Id");
                b.ToTable("NotasFiscais");
            });

            modelBuilder.Entity("FaturamentoService.Models.ItemNota", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer");
                b.Property<int>("NotaFiscalId").HasColumnType("integer");
                b.Property<int>("ProdutoId").HasColumnType("integer");
                b.Property<string>("ProdutoDescricao").IsRequired().HasColumnType("text");
                b.Property<int>("Quantidade").HasColumnType("integer");
                b.HasKey("Id");
                b.HasIndex("NotaFiscalId");
                b.ToTable("ItensNota");
            });

            modelBuilder.Entity("FaturamentoService.Models.ItemNota", b =>
            {
                b.HasOne("FaturamentoService.Models.NotaFiscal", "NotaFiscal")
                    .WithMany("Itens")
                    .HasForeignKey("NotaFiscalId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });
        }
    }
}
