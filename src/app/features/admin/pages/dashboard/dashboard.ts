import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SessionService } from '../../../../core/services/config/session';
import { UserService } from '../../../../core/services/user';
import { ReportService, DashboardStatsResponse } from '../../../../core/services/report';
import { ActivityService } from '../../../../core/services/activity';
import { ActivityResponse } from '../../../../core/models/activity';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private sessionService = inject(SessionService);
  private userService = inject(UserService);
  private reportService = inject(ReportService);
  private activityService = inject(ActivityService);

  userName = signal<string>('Administrador');
  loadingStats = signal<boolean>(true);
  loadingUsers = signal<boolean>(true);
  loadingActivity = signal<boolean>(true);

  stats = signal<DashboardStatsResponse | null>(null);
  totalUsers = signal<number>(0);
  activeUsers = signal<number>(0);
  inactiveUsers = signal<number>(0);
  recentActivities = signal<ActivityResponse[]>([]);

  ngOnInit(): void {
    const user = this.sessionService.getUser();
    if (user?.username) {
      this.userName.set(user.username);
    }

    this.loadAllData();
  }

  loadAllData(): void {
    this.loadingStats.set(true);
    this.reportService.getGlobalStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        if (res.totalUsers !== undefined) {
          this.totalUsers.set(res.totalUsers);
        }
        if (res.activeUsers !== undefined) {
          this.activeUsers.set(res.activeUsers);
        }
        if (res.inactiveUsers !== undefined) {
          this.inactiveUsers.set(res.inactiveUsers);
        }
        this.loadingStats.set(false);
      },
      error: () => {
        this.reportService.getStats().subscribe({
          next: (res) => {
            this.stats.set(res);
            this.loadingStats.set(false);
          },
          error: () => {
            this.loadingStats.set(false);
          }
        });
      }
    });

    this.loadingUsers.set(true);
    this.userService.findAll().subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          this.totalUsers.set(users.length);
          this.activeUsers.set(users.filter(u => u.isActive !== false).length);
          this.inactiveUsers.set(users.filter(u => u.isActive === false).length);
        }
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadingUsers.set(false);
      }
    });

    this.loadingActivity.set(true);
    this.activityService.findRecent(6).subscribe({
      next: (acts) => {
        this.recentActivities.set(Array.isArray(acts) ? acts : []);
        this.loadingActivity.set(false);
      },
      error: () => {
        this.recentActivities.set([]);
        this.loadingActivity.set(false);
      }
    });
  }

  formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatRelativeTime(dateStr?: string): string {
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
