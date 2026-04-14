namespace FaturamentoService.Services;

public class EstoqueClient
{
    private readonly HttpClient _http;

    public EstoqueClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<bool> BaixarEstoque(int produtoId, int quantidade)
    {
        var response = await _http.PostAsJsonAsync(
            $"/api/produtos/{produtoId}/baixar-estoque",
            new { Quantidade = quantidade }
        );
        return response.IsSuccessStatusCode;
    }

    public async Task<ProdutoDto?> GetProduto(int produtoId)
    {
        return await _http.GetFromJsonAsync<ProdutoDto>($"/api/produtos/{produtoId}");
    }
}

public class ProdutoDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int Saldo { get; set; }
}
