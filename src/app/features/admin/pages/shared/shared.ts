import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ShareService } from '../../../../core/services/share';
import { NotificationService } from '../../../../core/services/config/notification';
import { SharedResourceResponse, SharePermission } from '../../../../core/models/share';

interface EnrichedShareItem extends SharedResourceResponse {
  direction: 'by-me' | 'with-me';
}

@Component({
  selector: 'app-admin-shared',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './shared.html',
  styleUrl: './shared.css'
})
export class Shared implements OnInit {
  private shareService = inject(ShareService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  allShares = signal<EnrichedShareItem[]>([]);
  filteredShares = signal<EnrichedShareItem[]>([]);

  activeFilter = signal<'all' | 'by-me' | 'with-me'>('all');
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  updatingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadShares();
  }

  loadShares(): void {
    this.loading.set(true);
    this.shareService.findAll().subscribe({
      next: (res) => {
        const byMe: EnrichedShareItem[] = (res?.sharedByMe || []).map(item => ({
          ...item,
          direction: 'by-me'
        }));
        const withMe: EnrichedShareItem[] = (res?.sharedWithMe || []).map(item => ({
          ...item,
          direction: 'with-me'
        }));

        const combined = [...byMe, ...withMe];
        this.allShares.set(combined);
        this.applyFilter();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.allShares.set([]);
        this.applyFilter();
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(filter: 'all' | 'by-me' | 'with-me'): void {
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

    let items = this.allShares();

    if (filter === 'by-me') {
      items = items.filter(s => s.direction === 'by-me');
    } else if (filter === 'with-me') {
      items = items.filter(s => s.direction === 'with-me');
    }

    if (term) {
      items = items.filter(s => {
        const resourceName = s.resource?.name?.toLowerCase() || '';
        const ownerName = this.getUserLabel(s.ownerId).toLowerCase();
        const sharedWithName = this.getUserLabel(s.sharedWithId).toLowerCase();
        const type = s.resourceType?.toLowerCase() || '';
        return (
          resourceName.includes(term) ||
          ownerName.includes(term) ||
          sharedWithName.includes(term) ||
          type.includes(term)
        );
      });
    }

    this.filteredShares.set(items);
  }

  updatePermission(share: EnrichedShareItem, newPermission: SharePermission): void {
    if (share.permission === newPermission) return;
    this.updatingId.set(share._id);

    this.shareService.updateAuthorization(share._id, { permission: newPermission }).subscribe({
      next: () => {
        share.permission = newPermission;
        this.updatingId.set(null);
        this.notificationService.showSuccess('Permiso actualizado con éxito', 'Éxito');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.updatingId.set(null);
        this.notificationService.showError(err?.error?.message || 'No se pudo actualizar el permiso', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  revokeShare(share: EnrichedShareItem): void {
    const resName = share.resource?.name || 'este recurso';
    if (!confirm(`¿Está seguro de revocar el acceso a "${resName}"?`)) return;

    this.shareService.deleteShare(share._id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Acceso revocado correctamente', 'Éxito');
        this.loadShares();
      },
      error: (err) => {
        this.notificationService.showError(err?.error?.message || 'No se pudo revocar el acceso', 'Error');
      }
    });
  }

  getUserLabel(userRef: any): string {
    if (!userRef) return '—';
    if (typeof userRef === 'object') {
      return userRef.username || userRef.email || userRef._id || '—';
    }
    return String(userRef);
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

  getPermissionBadgeClass(perm: string): string {
    switch (perm) {
      case 'edit':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'comment':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
  }

  getPermissionLabel(perm: string): string {
    switch (perm) {
      case 'edit':
        return 'Edición';
      case 'comment':
        return 'Comentario';
      default:
        return 'Lectura';
    }
  }
}
