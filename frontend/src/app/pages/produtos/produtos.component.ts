import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProdutoService } from '../../services/produto.service';
import { Produto } from '../../models/produto.model';

@Component({
  selector: 'app-produtos',
  standalone: true,
  templateUrl: './produtos.component.html',
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ]
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];

  // Colunas exibidas na tabela — a ordem aqui define a ordem visual
  colunas = ['codigo', 'descricao', 'saldo', 'acoes'];

  form: FormGroup;

  // Guarda o produto sendo editado. null = modo criação, objeto = modo edição.
  // Usado como switch: evita criar uma variável booleana separada pois
  // o próprio objeto já carrega os dados necessários para o update.
  editando: Produto | null = null;

  // Controla exibição do spinner e desabilita o botão durante requisições,
  // evitando envios duplicados enquanto aguarda resposta da API.
  loading = false;

  constructor(
    private service: ProdutoService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // Definição do formulário reativo com validações
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      descricao: ['', Validators.required],
      // Saldo mínimo 0 — não faz sentido produto com saldo negativo no cadastro
      saldo: [0, [Validators.required, Validators.min(0)]]
    });
  }

  // Carrega a lista ao inicializar o componente
  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: p => {
        // Fallback para array vazio caso a API retorne null
        this.produtos = p ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snack.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Salva ou atualiza dependendo se há produto em edição
  salvar() {
    if (this.form.invalid) return;
    const dados = this.form.value;
    if (this.editando?.id) {
      
      // Modo edição — chama PUT com o ID do produto sendo editado
      this.service.update(this.editando.id, dados).subscribe({
        next: () => { this.snack.open('Produto atualizado!', '', { duration: 2000 }); this.cancelarEdicao(); this.carregar(); },
        error: err => this.snack.open(err.error || 'Erro ao atualizar', 'Fechar', { duration: 3000 })
      });
    } else {
      // Modo criação — chama POST
      this.service.create(dados).subscribe({
        next: () => { this.snack.open('Produto criado!', '', { duration: 2000 }); this.form.reset({ saldo: 0 }); this.carregar(); },
        error: err => this.snack.open(err.error || 'Erro ao criar produto', 'Fechar', { duration: 3000 })
      });
    }
  }

  // Preenche o formulário com os dados do produto e entra em modo edição
  editar(p: Produto) {
    this.editando = p;
    this.form.patchValue(p);
  }

  // Sai do modo edição e limpa o formulário
  cancelarEdicao() {
    this.editando = null;
    this.form.reset({ saldo: 0 });
  }

  deletar(p: Produto) {
    if (!confirm(`Excluir "${p.descricao}"?`)) return;
    this.service.delete(p.id!).subscribe({
      next: () => { this.snack.open('Produto excluído!', '', { duration: 2000 }); this.carregar(); },
      error: () => this.snack.open('Erro ao excluir', 'Fechar', { duration: 3000 })
    });
  }
}