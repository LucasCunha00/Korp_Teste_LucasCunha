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
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatSelectModule,
    MatChipsModule, MatTooltipModule
  ],
  template: `
    <h2>Notas Fiscais</h2>

    <mat-card style="margin-bottom: 24px;">
      <mat-card-title>Nova Nota Fiscal</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="criarNota()">
          <div formArrayName="itens">
            <div *ngFor="let item of itens.controls; let i = index" [formGroupName]="i"
                 style="display: flex; gap: 16px; align-items: flex-end; margin-bottom: 8px; flex-wrap: wrap;">
              <mat-form-field style="flex: 1; min-width: 200px;">
                <mat-label>Produto</mat-label>
                <mat-select formControlName="produtoId" (selectionChange)="onProdutoChange(i, $event.value)">
                  <mat-option *ngFor="let p of produtos" [value]="p.id">
                    {{ p.codigo }} - {{ p.descricao }} (saldo: {{ p.saldo }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field style="width: 120px;">
                <mat-label>Quantidade</mat-label>
                <input matInput type="number" formControlName="quantidade" min="1">
              </mat-form-field>
              <button mat-icon-button color="warn" type="button" (click)="removerItem(i)" matTooltip="Remover item">
                <mat-icon>remove_circle</mat-icon>
              </button>
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button mat-stroked-button type="button" (click)="adicionarItem()">
              <mat-icon>add</mat-icon> Adicionar Produto
            </button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || itens.length === 0 || salvando">
              <mat-icon>save</mat-icon> Criar Nota
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <div *ngIf="loading" style="text-align: center; padding: 32px;">
      <mat-spinner diameter="40" style="margin: 0 auto;"></mat-spinner>
    </div>

    <div *ngIf="!loading">
      <mat-card *ngFor="let nota of notas" style="margin-bottom: 16px;">
        <mat-card-content>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong>Nota #{{ nota.numeracao }}</strong>
              <span [style.color]="nota.status === 'Aberta' ? '#2e7d32' : '#c62828'"
                    style="margin-left: 12px; font-weight: 500;">
                {{ nota.status }}
              </span>
              <span style="margin-left: 12px; color: #666; font-size: 14px;">
                {{ nota.criadaEm | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button mat-raised-button color="accent"
                      *ngIf="nota.status === 'Aberta'"
                      (click)="imprimir(nota)"
                      [disabled]="imprimindo === nota.id">
                <mat-spinner *ngIf="imprimindo === nota.id" diameter="18" style="display: inline-block; margin-right: 4px;"></mat-spinner>
                <mat-icon *ngIf="imprimindo !== nota.id">print</mat-icon>
                Imprimir
              </button>
              <button mat-icon-button color="warn"
                      *ngIf="nota.status === 'Aberta'"
                      (click)="deletar(nota)"
                      matTooltip="Excluir nota">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <table mat-table [dataSource]="nota.itens" style="width: 100%; margin-top: 12px;" class="mat-elevation-z1">
            <ng-container matColumnDef="produto">
              <th mat-header-cell *matHeaderCellDef>Produto</th>
              <td mat-cell *matCellDef="let item">{{ item.produtoDescricao }}</td>
            </ng-container>
            <ng-container matColumnDef="quantidade">
              <th mat-header-cell *matHeaderCellDef>Quantidade</th>
              <td mat-cell *matCellDef="let item">{{ item.quantidade }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="colunasItens"></tr>
            <tr mat-row *matRowDef="let row; columns: colunasItens;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <p *ngIf="notas.length === 0" style="text-align: center; color: #666;">Nenhuma nota fiscal cadastrada.</p>
    </div>
  `
})
export class NotasComponent implements OnInit {
  notas: NotaFiscal[] = [];
  produtos: Produto[] = [];
  form: FormGroup;
  colunasItens = ['produto', 'quantidade'];
  loading = false;
  salvando = false;
  imprimindo: number | null = null;

  constructor(
    private notaService: NotaFiscalService,
    private produtoService: ProdutoService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({ itens: this.fb.array([]) });
  }

  get itens() { return this.form.get('itens') as FormArray; }

  ngOnInit() {
    this.carregar();
    this.produtoService.getAll().subscribe(p => { this.produtos = p; this.cdr.detectChanges(); });
  }

  carregar() {
    this.loading = true;
    this.notaService.getAll().subscribe({
      next: n => {
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

  adicionarItem() {
    this.itens.push(this.fb.group({
      produtoId: [null, Validators.required],
      produtoDescricao: [''],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removerItem(i: number) { this.itens.removeAt(i); }

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
        this.produtoService.getAll().subscribe(p => { this.produtos = p; this.cdr.detectChanges(); });
      },
      error: err => {
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