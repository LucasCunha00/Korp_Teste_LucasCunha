import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotaFiscalService } from '../../services/nota-fiscal.service';
import { ProdutoService } from '../../services/produto.service';
import { NotaFiscal } from '../../models/nota-fiscal.model';
import { Produto } from '../../models/produto.model';

@Component({
  selector: 'app-notas',
  standalone: true,
  templateUrl: './notas.component.html',
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatSelectModule,
    MatChipsModule, MatTooltipModule
  ]
})
export class NotasComponent implements OnInit {
  notas: NotaFiscal[] = [];
  produtos: Produto[] = [];
  form: FormGroup;
  colunasItens = ['produto', 'quantidade'];
  loading = false;
  salvando = false;

  // guarda o ID da nota sendo impressa — null = nenhuma
  // usado como switch: só o botão daquela nota específica trava
  imprimindo: number | null = null;

  constructor(
    private notaService: NotaFiscalService,
    private produtoService: ProdutoService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // FormArray vazio — itens são adicionados dinamicamente pelo usuário
    this.form = this.fb.group({ itens: this.fb.array([]) });
  }

  // atalho para acessar o FormArray de itens
  get itens() { return this.form.get('itens') as FormArray; }

  ngOnInit() {
    this.carregar();
    // carrega produtos para popular o select do formulário
    this.produtoService.getAll().subscribe(p => { this.produtos = p; this.cdr.detectChanges(); });
  }

  carregar() {
    this.loading = true;
    this.notaService.getAll().subscribe({
      next: n => {
        // ordena da mais recente pra mais antiga
        this.notas = n.sort((a, b) => (b.numeracao ?? 0) - (a.numeracao ?? 0));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snack.open('Erro ao carregar notas', 'Fechar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // adiciona uma linha nova de produto no formulário
  adicionarItem() {
    this.itens.push(this.fb.group({
      produtoId: [null, Validators.required],
      produtoDescricao: [''],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removerItem(i: number) { this.itens.removeAt(i); }

  // preenche a descrição automaticamente ao selecionar o produto
  onProdutoChange(i: number, produtoId: number) {
    const produto = this.produtos.find(p => p.id === produtoId);
    if (produto) this.itens.at(i).patchValue({ produtoDescricao: produto.descricao });
  }

  criarNota() {
    if (this.form.invalid || this.itens.length === 0) return;
    this.salvando = true;
    this.notaService.create({ itens: this.itens.value }).subscribe({
      next: () => {
        this.snack.open('Nota criada!', '', { duration: 2000 });
        this.itens.clear();
        setTimeout(() => this.carregar(), 100);
        this.salvando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snack.open('Erro ao criar nota', 'Fechar', { duration: 3000 });
        this.salvando = false;
      }
    });
  }

  imprimir(nota: NotaFiscal) {
    this.imprimindo = nota.id!;
    this.notaService.imprimir(nota.id!).subscribe({
      next: () => {
        this.snack.open(`Nota #${nota.numeracao} impressa e fechada!`, '', { duration: 3000 });
        this.imprimindo = null;
        setTimeout(() => this.carregar(), 100);
        // atualiza saldos dos produtos após baixa de estoque
        this.produtoService.getAll().subscribe(p => { this.produtos = p; this.cdr.detectChanges(); });
      },
      error: err => {
        // pode ser saldo insuficiente ou estoque service fora do ar
        const msg = err.error || 'Serviço de estoque indisponível. Tente novamente.';
        this.snack.open(msg, 'Fechar', { duration: 5000 });
        this.imprimindo = null;
        this.cdr.detectChanges();
      }
    });
  }

  deletar(nota: NotaFiscal) {
    if (!confirm(`Excluir nota #${nota.numeracao}?`)) return;
    this.notaService.delete(nota.id!).subscribe({
      next: () => {
        this.snack.open('Nota excluída!', '', { duration: 2000 });
        setTimeout(() => this.carregar(), 100);
      },
      error: () => this.snack.open('Erro ao excluir', 'Fechar', { duration: 3000 })
    });
  }
}