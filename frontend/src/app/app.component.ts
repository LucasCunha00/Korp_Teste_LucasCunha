import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>receipt_long</mat-icon>
      <span style="margin-left: 8px; font-weight: bold;">Korp NF</span>
      <span style="flex: 1"></span>
      <button mat-button routerLink="/produtos" routerLinkActive="active-link">
        <mat-icon>inventory_2</mat-icon> Produtos
      </button>
      <button mat-button routerLink="/notas" routerLinkActive="active-link">
        <mat-icon>description</mat-icon> Notas Fiscais
      </button>
    </mat-toolbar>
    <div class="container">
      <router-outlet />
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .active-link { background: rgba(255,255,255,0.15); border-radius: 4px; }
  `]
})
export class AppComponent {}
