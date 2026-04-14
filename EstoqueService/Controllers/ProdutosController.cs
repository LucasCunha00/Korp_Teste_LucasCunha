using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EstoqueService.Data;
using EstoqueService.Models;

namespace EstoqueService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProdutosController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var produtos = await _db.Produtos.ToListAsync();
        return Ok(produtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var produto = await _db.Produtos.FindAsync(id);
        if (produto == null) return NotFound();
        return Ok(produto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Produto produto)
    {
        if (await _db.Produtos.AnyAsync(p => p.Codigo == produto.Codigo))
            return BadRequest("Já existe um produto com esse código.");

        _db.Produtos.Add(produto);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = produto.Id }, produto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Produto produto)
    {
        var existing = await _db.Produtos.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Codigo = produto.Codigo;
        existing.Descricao = produto.Descricao;
        existing.Saldo = produto.Saldo;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var produto = await _db.Produtos.FindAsync(id);
        if (produto == null) return NotFound();

        _db.Produtos.Remove(produto);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/baixar-estoque")]
    public async Task<IActionResult> BaixarEstoque(int id, [FromBody] BaixaEstoqueRequest request)
    {
        // FOR UPDATE = lock pessimista para evitar concorrência
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var produto = await _db.Produtos
                .FromSqlRaw("SELECT * FROM estoque.\"Produtos\" WHERE \"Id\" = {0} FOR UPDATE", id)
                .FirstOrDefaultAsync();

            if (produto == null)
                return NotFound("Produto não encontrado.");

            if (produto.Saldo < request.Quantidade)
                return BadRequest($"Saldo insuficiente. Saldo atual: {produto.Saldo}");

            produto.Saldo -= request.Quantidade;
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(produto);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}

public class BaixaEstoqueRequest
{
    public int Quantidade { get; set; }
}
