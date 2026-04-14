namespace FaturamentoService.Models;

public class NotaFiscal
{
    public int Id { get; set; }
    public int Numeracao { get; set; }
    public string Status { get; set; } = "Aberta";
    public DateTime CriadaEm { get; set; } = DateTime.UtcNow;
    public List<ItemNota> Itens { get; set; } = new();
}

public class ItemNota
{
    public int Id { get; set; }
    public int NotaFiscalId { get; set; }
    public int ProdutoId { get; set; }
    public string ProdutoDescricao { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public NotaFiscal? NotaFiscal { get; set; }
}
