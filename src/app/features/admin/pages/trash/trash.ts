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
import { MatTooltipModule } from '@angular/material/tooltip';

import { TrashService } from '../../../../core/services/trash';
import { NotificationService } from '../../../../core/services/config/notification';
import { TrashListResponse } from '../../../../core/models/trash';

interface TrashItem {
  _id: string;
  name: string;
  type: 'folder' | 'md' | 'txt';
  sizeBytes?: number;
  deletedAt: string;
}

@Component({
  selector: 'app-admin-trash',
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
    MatTooltipModule
  ],
  templateUrl: './trash.html',
  styleUrl: './trash.css'
})
export class Trash implements OnInit {
  private trashService = inject(TrashService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  allItems = signal<TrashItem[]>([]);
  filteredItems = signal<TrashItem[]>([]);

  activeFilter = signal<'all' | 'folders' | 'files'>('all');
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  restoringId = signal<string | null>(null);
  purgingId = signal<string | null>(null);
  emptying = signal<boolean>(false);

  ngOnInit(): void {
    this.loadTrash();
  }

  loadTrash(): void {
    this.loading.set(true);
    this.trashService.findAll().subscribe({
      next: (res: TrashListResponse) => {
        const folderItems: TrashItem[] = (res?.folders || []).map(f => ({
          _id: f._id,
          name: f.name,
          type: 'folder',
          sizeBytes: 0,
          deletedAt: f.deletedAt || f.updatedAt || f.createdAt
        }));

        const fileItems: TrashItem[] = (res?.files || []).map(f => ({
          _id: f._id,
          name: f.name,
          type: f.type,
          sizeBytes: f.size ?? (f as any).sizeBytes ?? 0,
          deletedAt: f.deletedAt || f.updatedAt || f.createdAt
        }));

        const combined = [...folderItems, ...fileItems].sort((a, b) => {
          return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
        });

        this.allItems.set(combined);
        this.applyFilter();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.allItems.set([]);
        this.applyFilter();
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(filter: 'all' | 'folders' | 'files'): void {
    this.activeFilter.set(filter);
    this.applyFilter();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.applyFilter();
  }

  applyFilter(): void {
    const filter = this.activeFilter();
    const term = this.searchTerm().trim().toLowerCase();

    let list = this.allItems();

    if (filter === 'folders') {
      list = list.filter(item => item.type === 'folder');
    } else if (filter === 'files') {
      list = list.filter(item => item.type !== 'folder');
    }

    if (term) {
      list = list.filter(item => item.name.toLowerCase().includes(term));
    }

    this.filteredItems.set(list);
  }

  restoreItem(item: TrashItem): void {
    this.restoringId.set(item._id);
    this.trashService.restore(item._id).subscribe({
      next: () => {
        this.restoringId.set(null);
        this.notificationService.showSuccess(`"${item.name}" restaurado con éxito`, 'Éxito');
        this.loadTrash();
      },
      error: (err) => {
        this.restoringId.set(null);
        this.notificationService.showError(err?.error?.message || 'Error al restaurar elemento', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  purgeItem(item: TrashItem): void {
    if (!confirm(`¿Está seguro de eliminar definitivamente "${item.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.purgingId.set(item._id);
    this.trashService.purge(item._id).subscribe({
      next: () => {
        this.purgingId.set(null);
        this.notificationService.showSuccess(`"${item.name}" eliminado definitivamente`, 'Éxito');
        this.loadTrash();
      },
      error: (err) => {
        this.purgingId.set(null);
        this.notificationService.showError(err?.error?.message || 'Error al purgar elemento', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  emptyTrash(): void {
    if (this.allItems().length === 0) return;
    if (!confirm('¿Está seguro de vaciar la papelera? Todos los elementos se eliminarán de forma permanente.')) {
      return;
    }

    this.emptying.set(true);
    this.trashService.emptyTrash().subscribe({
      next: () => {
        this.emptying.set(false);
        this.notificationService.showSuccess('Papelera vaciada correctamente', 'Éxito');
        this.loadTrash();
      },
      error: (err) => {
        this.emptying.set(false);
        this.notificationService.showError(err?.error?.message || 'Error al vaciar papelera', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
