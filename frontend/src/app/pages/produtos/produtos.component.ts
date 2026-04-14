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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProdutoService } from '../../services/produto.service';
import { Produto } from '../../models/produto.model';


@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule
  ],
  template: `
    <h2>Produtos</h2>

    <mat-card style="margin-bottom: 24px;">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="salvar()" style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;">
          <mat-form-field>
            <mat-label>Código</mat-label>
            <input matInput formControlName="codigo" placeholder="Ex: PROD001">
          </mat-form-field>
          <mat-form-field style="flex: 1; min-width: 200px;">
            <mat-label>Descrição</mat-label>
            <input matInput formControlName="descricao" placeholder="Nome do produto">
          </mat-form-field>
          <mat-form-field style="width: 120px;">
            <mat-label>Saldo</mat-label>
            <input matInput type="number" formControlName="saldo">
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
            <mat-icon>{{ editando ? 'save' : 'add' }}</mat-icon>
            {{ editando ? 'Salvar' : 'Adicionar' }}
          </button>
          <button mat-button type="button" *ngIf="editando" (click)="cancelarEdicao()">Cancelar</button>
        </form>
      </mat-card-content>
    </mat-card>

    <div *ngIf="loading" style="text-align: center; padding: 32px;">
      <mat-spinner diameter="40" style="margin: 0 auto;"></mat-spinner>
    </div>

    <table mat-table [dataSource]="produtos" *ngIf="!loading" class="mat-elevation-z2" style="width: 100%;">
      <ng-container matColumnDef="codigo">
        <th mat-header-cell *matHeaderCellDef>Código</th>
        <td mat-cell *matCellDef="let p">{{ p.codigo }}</td>
      </ng-container>
      <ng-container matColumnDef="descricao">
        <th mat-header-cell *matHeaderCellDef>Descrição</th>
        <td mat-cell *matCellDef="let p">{{ p.descricao }}</td>
      </ng-container>
      <ng-container matColumnDef="saldo">
        <th mat-header-cell *matHeaderCellDef>Saldo</th>
        <td mat-cell *matCellDef="let p">{{ p.saldo }}</td>
      </ng-container>
      <ng-container matColumnDef="acoes">
        <th mat-header-cell *matHeaderCellDef>Ações</th>
        <td mat-cell *matCellDef="let p">
          <button mat-icon-button color="primary" (click)="editar(p)" matTooltip="Editar">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deletar(p)" matTooltip="Excluir">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="colunas"></tr>
      <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell" colspan="4" style="text-align: center; padding: 16px;">Nenhum produto cadastrado.</td>
      </tr>
    </table>
  `
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  colunas = ['codigo', 'descricao', 'saldo', 'acoes'];
  form: FormGroup;
  editando: Produto | null = null;
  loading = false;

  constructor(
    private service: ProdutoService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
   private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      descricao: ['', Validators.required],
      saldo: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: p => {
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

  salvar() {
    if (this.form.invalid) return;
    const dados = this.form.value;
    if (this.editando?.id) {
      this.service.update(this.editando.id, dados).subscribe({
        next: () => { this.snack.open('Produto atualizado!', '', { duration: 2000 }); this.cancelarEdicao(); this.carregar(); },
        error: err => this.snack.open(err.error || 'Erro ao atualizar', 'Fechar', { duration: 3000 })
      });
    } else {
      this.service.create(dados).subscribe({
        next: () => { this.snack.open('Produto criado!', '', { duration: 2000 }); this.form.reset({ saldo: 0 }); this.carregar(); },
        error: err => this.snack.open(err.error || 'Erro ao criar produto', 'Fechar', { duration: 3000 })
      });
    }
  }

  editar(p: Produto) {
    this.editando = p;
    this.form.patchValue(p);
  }

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
