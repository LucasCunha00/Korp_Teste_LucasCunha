using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FaturamentoService.Data;
using FaturamentoService.Models;
using FaturamentoService.Services;

namespace FaturamentoService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotasFiscaisController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EstoqueClient _estoqueClient;

    public NotasFiscaisController(AppDbContext db, EstoqueClient estoqueClient)
    {
        _db = db;
        _estoqueClient = estoqueClient;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var notas = await _db.NotasFiscais.Include(n => n.Itens).ToListAsync();
        return Ok(notas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var nota = await _db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Id == id);
        if (nota == null) return NotFound();
        return Ok(nota);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CriarNotaRequest request)
    {
        var ultimaNumeracao = await _db.NotasFiscais.MaxAsync(n => (int?)n.Numeracao) ?? 0;

        var nota = new NotaFiscal
        {
            Numeracao = ultimaNumeracao + 1,
            Status = "Aberta",
            Itens = request.Itens.Select(i => new ItemNota
            {
                ProdutoId = i.ProdutoId,
                ProdutoDescricao = i.ProdutoDescricao,
                Quantidade = i.Quantidade
            }).ToList()
        };

        _db.NotasFiscais.Add(nota);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = nota.Id }, nota);
    }

    [HttpPost("{id}/imprimir")]
    public async Task<IActionResult> Imprimir(int id)
    {
        var nota = await _db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Id == id);
        if (nota == null) return NotFound();

        if (nota.Status != "Aberta")
            return BadRequest("Somente notas com status 'Aberta' podem ser impressas.");

        // Tenta baixar estoque de cada item
        foreach (var item in nota.Itens)
        {
            bool sucesso;
            try
            {
                sucesso = await _estoqueClient.BaixarEstoque(item.ProdutoId, item.Quantidade);
            }
            catch (Exception)
            {
                return StatusCode(503, "Serviço de estoque indisponível. A nota não foi fechada. Tente novamente.");
            }

            if (!sucesso)
                return BadRequest($"Saldo insuficiente para o produto ID {item.ProdutoId}.");
        }

        nota.Status = "Fechada";
        await _db.SaveChangesAsync();

        return Ok(nota);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var nota = await _db.NotasFiscais.FindAsync(id);
        if (nota == null) return NotFound();
        if (nota.Status == "Fechada") return BadRequest("Não é possível excluir uma nota fechada.");

        _db.NotasFiscais.Remove(nota);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CriarNotaRequest
{
    public List<ItemNotaRequest> Itens { get; set; } = new();
}

public class ItemNotaRequest
{
    public int ProdutoId { get; set; }
    public string ProdutoDescricao { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}
