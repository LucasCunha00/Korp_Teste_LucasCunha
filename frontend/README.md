# Korp_Teste_LucasCunha

Sistema de emissão de Notas Fiscais desenvolvido como teste técnico para a Korp ERP.

## Tecnologias

**Frontend:** Angular 21 + Angular Material  
**Backend:** .NET 8 (C#) com arquitetura de microsserviços  
**Banco de dados:** PostgreSQL 16  
**Infraestrutura:** Docker + Docker Compose  

## Arquitetura

O sistema é composto por dois microsserviços independentes:

**EstoqueService** (porta 5001) — responsável pelo cadastro de produtos e controle de saldo  
**FaturamentoService** (porta 5002) — responsável pela gestão de notas fiscais

A comunicação entre os serviços é feita via HTTP REST. O FaturamentoService chama o EstoqueService ao imprimir uma nota, realizando a baixa de estoque de cada item.

```
Angular (4200) → FaturamentoService (5002) → EstoqueService (5001) → PostgreSQL (5432)
                                           ↗
Angular (4200) → EstoqueService (5001) ──
```

## Funcionalidades

- Cadastro de produtos com código, descrição e saldo
- Criação de notas fiscais com múltiplos produtos e quantidades
- Numeração sequencial automática de notas
- Impressão de nota: fecha a nota e baixa o estoque de cada item
- Validação de saldo insuficiente antes da impressão
- Bloqueio de impressão de notas já fechadas
- Tratamento de falha entre microsserviços: se o EstoqueService estiver indisponível, a nota não é fechada e o usuário recebe feedback claro
- Lock pessimista (`FOR UPDATE`) para tratamento de concorrência no estoque

## Pré-requisitos

- Docker Desktop instalado e rodando

## Como rodar

```bash
# Clone o repositório
git clone https://github.com/LucasCunha00/Korp_Teste_LucasCunha
cd Korp_Teste_LucasCunha

# Suba os containers
docker-compose up --build

# Em outro terminal, acesse o frontend
cd frontend
npm install
ng serve
```

Acesse: http://localhost:4200

## Variáveis de ambiente

Configuradas automaticamente pelo docker-compose:

| Variável | Valor |
|---|---|
| POSTGRES_USER | korp |
| POSTGRES_PASSWORD | korp123 |
| POSTGRES_DB | korpdb |
| EstoqueService__BaseUrl | http://estoque:8080 |

## Estrutura do projeto

```
Korp_Teste_LucasCunha/
├── EstoqueService/          # Microsserviço de estoque (.NET 8)
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   └── Program.cs
├── FaturamentoService/      # Microsserviço de faturamento (.NET 8)
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
├── frontend/                # Aplicação Angular
│   └── src/app/
│       ├── pages/
│       ├── services/
│       └── models/
└── docker-compose.yml
```

## Detalhamento técnico

### Ciclos de vida do Angular utilizados
- `ngOnInit` — carregamento inicial de produtos e notas fiscais
- `ChangeDetectorRef.detectChanges()` — forçar atualização da view após operações assíncronas

### RxJS
Utilizado através do `HttpClient` que retorna `Observable`. Todas as chamadas HTTP usam `.subscribe()` com `next`, `error` e `complete` para tratamento completo do ciclo de vida da requisição.

### Bibliotecas de componentes visuais
- `@angular/material` — componentes de UI (toolbar, table, form-field, button, snackbar, spinner, select)
- `@angular/cdk` — base do Angular Material

### Frameworks utilizados no backend
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core 8 com provider Npgsql para PostgreSQL

### Tratamento de erros e exceções
- Try/catch em todos os endpoints com retorno de status HTTP adequado
- Tratamento específico de falha de comunicação entre serviços: `catch (Exception)` na chamada HTTP ao EstoqueService retorna HTTP 503 com mensagem clara
- Validação de saldo insuficiente retorna HTTP 400
- Validação de nota já fechada retorna HTTP 400

### LINQ utilizado
```csharp
var ultimaNumeracao = await _db.NotasFiscais.MaxAsync(n => (int?)n.Numeracao) ?? 0;
```
Utilizado para calcular a numeração sequencial da próxima nota fiscal.

### Tratamento de concorrência
Lock pessimista implementado com `FOR UPDATE` no PostgreSQL:
```csharp
var produto = await _db.Produtos
    .FromSqlRaw("SELECT * FROM estoque.\"Produtos\" WHERE \"Id\" = {0} FOR UPDATE", id)
    .FirstOrDefaultAsync();
```
Garante que dois pedidos simultâneos não causem saldo negativo.

### Cenário de falha entre microsserviços
Para demonstrar: pare o container `estoque-1` no Docker Desktop e tente imprimir uma nota. O sistema exibirá "Serviço de estoque indisponível. A nota não foi fechada." e manterá a nota com status Aberta.