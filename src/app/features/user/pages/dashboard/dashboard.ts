import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileService } from '../../../../core/services/file';
import { ActivityService } from '../../../../core/services/activity';
import { ReportService } from '../../../../core/services/report';
import { SessionService } from '../../../../core/services/config/session';
import { FileResponse } from '../../../../core/models/file';
import { ActivityResponse } from '../../../../core/models/activity';

interface SuggestedFile {
  id: string;
  name: string;
  type: 'md' | 'txt';
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  openedAgo: string;
  ownerName: string;
  ownerAvatar: string;
  status: 'Compartido' | 'Privado' | 'Activo';
  statusType: 'shared' | 'private' | 'active';
  collaborators?: string[];
}

interface QuickStat {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  color: string;
}

interface RecentActivity {
  id: string;
  name: string;
  type: 'md' | 'txt';
  action: string;
  user: string;
  time: string;
  size: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private fileService = inject(FileService);
  private activityService = inject(ActivityService);
  private reportService = inject(ReportService);
  private sessionService = inject(SessionService);

  searchQuery = signal<string>('');
  selectedFilter = signal<string>('all');

  quickFilters = [
    { id: 'all', label: 'Todos' },
    { id: 'md', label: 'Documentos (.md)' },
    { id: 'txt', label: 'Archivos (.txt)' },
    { id: 'shared', label: 'Compartidos' },
    { id: 'recent', label: 'Recientes' }
  ];

  stats = signal<QuickStat[]>([
    {
      label: 'Almacenamiento en uso',
      value: '0 B',
      subtext: 'de 5.0 GB disponibles (0%)',
      icon: 'pie_chart',
      color: '#06B6D4'
    },
    {
      label: 'Documentos Markdown',
      value: '0',
      subtext: 'archivos .md creados',
      icon: 'article',
      color: '#A855F7'
    },
    {
      label: 'Archivos de Texto',
      value: '0',
      subtext: 'archivos .txt almacenados',
      icon: 'description',
      color: '#FB923C'
    },
    {
      label: 'Recursos Compartidos',
      value: '0',
      subtext: 'con permisos activos',
      icon: 'folder_shared',
      color: '#10B981'
    }
  ]);

  suggestedFiles = signal<SuggestedFile[]>([]);
  recentActivities = signal<RecentActivity[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const user = this.sessionService.getUser();

    this.reportService.getStats().subscribe({
      next: (res) => {
        if (!res) return;
        const usedFormatted = this.formatBytes(res.storageUsedBytes);
        const percent = res.storagePercentage ?? 0;

        this.stats.set([
          {
            label: 'Almacenamiento en uso',
            value: usedFormatted,
            subtext: `de 5.0 GB disponibles (${percent}%)`,
            icon: 'pie_chart',
            color: '#06B6D4'
          },
          {
            label: 'Documentos Markdown',
            value: (res.mdCount ?? 0).toString(),
            subtext: 'archivos .md creados',
            icon: 'article',
            color: '#A855F7'
          },
          {
            label: 'Archivos de Texto',
            value: (res.txtCount ?? 0).toString(),
            subtext: 'archivos .txt almacenados',
            icon: 'description',
            color: '#FB923C'
          },
          {
            label: 'Recursos Compartidos',
            value: (res.sharedCount ?? 0).toString(),
            subtext: 'con permisos activos',
            icon: 'folder_shared',
            color: '#10B981'
          }
        ]);
      },
      error: () => {}
    });

    this.fileService.getRecent(4).subscribe({
      next: (files: FileResponse[]) => {
        if (!files || files.length === 0) {
          this.suggestedFiles.set([]);
          return;
        }

        const mapped: SuggestedFile[] = files.map(f => {
          const isMd = f.type === 'md';
          const ownerName = user?.username || 'Tú';
          return {
            id: f._id,
            name: f.name,
            type: f.type,
            badgeColor: isMd ? '#06B6D4' : '#10B981',
            iconBg: isMd ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            iconColor: isMd ? '#06B6D4' : '#10B981',
            openedAgo: this.formatRelativeTime(f.updatedAt || f.createdAt),
            ownerName: ownerName,
            ownerAvatar: this.getAvatarInitials(ownerName),
            status: 'Activo',
            statusType: 'active'
          };
        });
        this.suggestedFiles.set(mapped);
      },
      error: () => {
        this.suggestedFiles.set([]);
      }
    });

    this.activityService.findRecent(10).subscribe({
      next: (activities: ActivityResponse[]) => {
        if (!activities || activities.length === 0) {
          this.recentActivities.set([]);
          return;
        }

        const actionTranslations: Record<string, string> = {
          upload: 'Subido',
          download: 'Descargado',
          rename: 'Renombrado',
          move: 'Movido',
          delete: 'Eliminado',
          restore: 'Restaurado',
          purge: 'Purgado',
          share: 'Compartido',
          unshare: 'Descompartido'
        };

        const mapped: RecentActivity[] = activities.map(act => {
          const isMd = act.resourceName ? act.resourceName.toLowerCase().endsWith('.md') : false;
          const size = act.details?.['size'] ? this.formatBytes(act.details['size']) : '-';
          return {
            id: act._id,
            name: act.resourceName || 'Archivo',
            type: isMd ? 'md' : 'txt',
            action: actionTranslations[act.action] || act.action,
            user: user?.username || 'Tú',
            time: this.formatRelativeTime(act.createdAt),
            size: size
          };
        });
        this.recentActivities.set(mapped);
      },
      error: () => {
        this.recentActivities.set([]);
      }
    });
  }

  private getAvatarInitials(name: string): string {
    if (!name) return 'TU';
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  setFilter(id: string): void {
    this.selectedFilter.set(id);
  }

  filteredSuggested(): SuggestedFile[] {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedFilter();

    return this.suggestedFiles().filter(f => {
      const matchesSearch = !q || f.name.toLowerCase().includes(q) || f.ownerName.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filter === 'md') return f.type === 'md';
      if (filter === 'txt') return f.type === 'txt';
      if (filter === 'shared') return f.statusType === 'shared';
      return true;
    });
  }
}
