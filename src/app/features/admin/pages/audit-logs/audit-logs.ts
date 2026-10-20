import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ActivityService } from '../../../../core/services/activity';
import { ActivityResponse } from '../../../../core/models/activity';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  private activityService = inject(ActivityService);
  private cdr = inject(ChangeDetectorRef);

  logs: ActivityResponse[] = [];
  filteredLogs: ActivityResponse[] = [];
  paginatedLogs: ActivityResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  selectedAction = 'all';
  loading = true;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.activityService.findRecent(100).subscribe({
      next: (data) => {
        this.logs = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.logs = [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.logs];

    if (this.selectedAction !== 'all') {
      result = result.filter(item => item.action === this.selectedAction);
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(item => {
        const nameMatch = item.resourceName?.toLowerCase().includes(term) ?? false;
        const typeMatch = item.resourceType?.toLowerCase().includes(term) ?? false;
        const idMatch = item.resourceId?.toLowerCase().includes(term) ?? false;
        const userMatch = item.userId?.toLowerCase().includes(term) ?? false;
        return nameMatch || typeMatch || idMatch || userMatch;
      });
    }

    this.filteredLogs = result;
    this.totalElements = result.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedLogs = result.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  onActionFilterChange(action: string): void {
    this.selectedAction = action;
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'upload':
      case 'create':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'share':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
      case 'delete':
      case 'purge':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'restore':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
    }
  }

  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      upload: 'Subida',
      create: 'Creación',
      download: 'Descarga',
      rename: 'Renombrado',
      move: 'Movimiento',
      delete: 'Eliminación',
      restore: 'Restauración',
      purge: 'Purgado',
      share: 'Compartido',
      unshare: 'Descompartido'
    };
    return map[action] || action;
  }
}
