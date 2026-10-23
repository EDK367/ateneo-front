import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ReportService,
  DashboardStatsResponse,
  FileTypeReportItem,
  FileDateRangeReportItem,
  MostActiveFileReportItem,
  TopUserFileReportItem,
  TopUserShareReportItem,
  UserShareReportItem,
  NeverSharedFileReportItem,
  FolderMostFilesReportItem,
  FileMostSharedUsersReportItem
} from '../../../../core/services/report';
import { UserService } from '../../../../core/services/user';
import { ActivityService } from '../../../../core/services/activity';
import { UserResponse } from '../../../../core/models/user';
import { ActivityResponse } from '../../../../core/models/activity';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  private reportService = inject(ReportService);
  private userService = inject(UserService);
  private activityService = inject(ActivityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  selectedTabIndex = signal<number>(0);
  loading = signal<boolean>(true);

  stats = signal<DashboardStatsResponse | null>(null);
  users = signal<UserResponse[]>([]);
  activities = signal<ActivityResponse[]>([]);
  filteredActivities = signal<ActivityResponse[]>([]);

  selectedActionFilter = signal<string>('all');

  actionFilters = [
    { id: 'all', label: 'Todas las acciones' },
    { id: 'upload', label: 'Subidas' },
    { id: 'create', label: 'Creaciones' },
    { id: 'share', label: 'Compartidos' },
    { id: 'delete', label: 'Eliminaciones' },
    { id: 'restore', label: 'Restauraciones' }
  ];

  selectedRubricReport = signal<string>('filesByType');
  rubricReports = [
    { id: 'filesByType', label: 'Archivos por tipo', icon: 'pie_chart' },
    { id: 'filesByDateRange', label: 'Archivos por rango de fechas', icon: 'date_range' },
    { id: 'filesMostOperations', label: 'Archivos con más operaciones', icon: 'trending_up' },
    { id: 'topUsersFiles', label: 'Top 10 usuarios con más archivos', icon: 'people' },
    { id: 'topUsersShares', label: 'Usuarios que más comparten', icon: 'share' },
    { id: 'sharedByUser', label: 'Compartidos por usuario', icon: 'outbox' },
    { id: 'receivedByUser', label: 'Recibidos por usuario', icon: 'move_to_inbox' },
    { id: 'neverShared', label: 'Archivos nunca compartidos', icon: 'lock' },
    { id: 'foldersMostFiles', label: 'Carpetas con más archivos', icon: 'folder' },
    { id: 'filesMostSharedUsers', label: 'Archivos más compartidos', icon: 'group' }
  ];

  filterStartDate = signal<string>('');
  filterEndDate = signal<string>('');
  filterSelectedUserId = signal<string>('');

  rubricLoading = signal<boolean>(false);
  filesByTypeData = signal<FileTypeReportItem[]>([]);
  filesByDateRangeData = signal<FileDateRangeReportItem[]>([]);
  mostActiveFilesData = signal<MostActiveFileReportItem[]>([]);
  topUsersFilesData = signal<TopUserFileReportItem[]>([]);
  topUsersSharesData = signal<TopUserShareReportItem[]>([]);
  sharedByUserData = signal<UserShareReportItem[]>([]);
  sharedWithUserData = signal<UserShareReportItem[]>([]);
  neverSharedFilesData = signal<NeverSharedFileReportItem[]>([]);
  foldersMostFilesData = signal<FolderMostFilesReportItem[]>([]);
  filesMostSharedUsersData = signal<FileMostSharedUsersReportItem[]>([]);

  ngOnInit(): void {
    this.detectTabFromUrl();
    this.loadData();
  }

  detectTabFromUrl(): void {
    const url = this.router.url;
    if (url.includes('/reports/storage')) {
      this.selectedTabIndex.set(0);
    } else if (url.includes('/reports/users')) {
      this.selectedTabIndex.set(1);
    } else if (url.includes('/reports/activity')) {
      this.selectedTabIndex.set(2);
    } else if (url.includes('/reports/rubric')) {
      this.selectedTabIndex.set(3);
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    if (index === 0) {
      this.router.navigate(['/admin/reports/storage']);
    } else if (index === 1) {
      this.router.navigate(['/admin/reports/users']);
    } else if (index === 2) {
      this.router.navigate(['/admin/reports/activity']);
    } else if (index === 3) {
      this.router.navigate(['/admin/reports/rubric']);
      this.loadRubricReport(this.selectedRubricReport());
    }
  }

  loadData(): void {
    this.loading.set(true);

    this.reportService.getGlobalStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: () => {
        this.reportService.getStats().subscribe({
          next: (stats) => {
            this.stats.set(stats);
          },
          error: () => {}
        });
      }
    });

    this.userService.findAll().subscribe({
      next: (usersList) => {
        const sorted = (Array.isArray(usersList) ? usersList : []).sort((a, b) => {
          return (b.storageUsedBytes || 0) - (a.storageUsedBytes || 0);
        });
        this.users.set(sorted);
        if (sorted.length > 0 && !this.filterSelectedUserId()) {
          this.filterSelectedUserId.set(sorted[0]._id);
        }
      },
      error: () => {}
    });

    this.activityService.findRecent(50).subscribe({
      next: (actList) => {
        const list = Array.isArray(actList) ? actList : [];
        this.activities.set(list);
        this.applyActionFilter();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  selectRubricReport(id: string): void {
    this.selectedRubricReport.set(id);
    this.loadRubricReport(id);
  }

  loadRubricReport(id?: string): void {
    const reportId = id || this.selectedRubricReport();
    this.rubricLoading.set(true);

    switch (reportId) {
      case 'filesByType':
        this.reportService.getFilesByType().subscribe({
          next: (data) => {
            this.filesByTypeData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'filesByDateRange':
        this.reportService.getFilesByDateRange(this.filterStartDate(), this.filterEndDate()).subscribe({
          next: (data) => {
            this.filesByDateRangeData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'filesMostOperations':
        this.reportService.getFilesMostOperations(15).subscribe({
          next: (data) => {
            this.mostActiveFilesData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'topUsersFiles':
        this.reportService.getTopUsersWithMostFiles().subscribe({
          next: (data) => {
            this.topUsersFilesData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'topUsersShares':
        this.reportService.getTopUsersWithMostShares(15).subscribe({
          next: (data) => {
            this.topUsersSharesData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'sharedByUser':
        if (!this.filterSelectedUserId() && this.users().length > 0) {
          this.filterSelectedUserId.set(this.users()[0]._id);
        }
        if (this.filterSelectedUserId()) {
          this.reportService.getResourcesSharedByUser(this.filterSelectedUserId()).subscribe({
            next: (data) => {
              this.sharedByUserData.set(Array.isArray(data) ? data : []);
              this.rubricLoading.set(false);
              this.cdr.detectChanges();
            },
            error: () => {
              this.rubricLoading.set(false);
              this.cdr.detectChanges();
            }
          });
        } else {
          this.rubricLoading.set(false);
        }
        break;

      case 'receivedByUser':
        if (!this.filterSelectedUserId() && this.users().length > 0) {
          this.filterSelectedUserId.set(this.users()[0]._id);
        }
        if (this.filterSelectedUserId()) {
          this.reportService.getResourcesReceivedByUser(this.filterSelectedUserId()).subscribe({
            next: (data) => {
              this.sharedWithUserData.set(Array.isArray(data) ? data : []);
              this.rubricLoading.set(false);
              this.cdr.detectChanges();
            },
            error: () => {
              this.rubricLoading.set(false);
              this.cdr.detectChanges();
            }
          });
        } else {
          this.rubricLoading.set(false);
        }
        break;

      case 'neverShared':
        this.reportService.getNeverSharedFiles(50).subscribe({
          next: (data) => {
            this.neverSharedFilesData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'foldersMostFiles':
        this.reportService.getFoldersWithMostFiles(15).subscribe({
          next: (data) => {
            this.foldersMostFilesData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      case 'filesMostSharedUsers':
        this.reportService.getFilesSharedWithMostUsers(15).subscribe({
          next: (data) => {
            this.filesMostSharedUsersData.set(Array.isArray(data) ? data : []);
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.rubricLoading.set(false);
            this.cdr.detectChanges();
          }
        });
        break;

      default:
        this.rubricLoading.set(false);
    }
  }

  setActionFilter(action: string): void {
    this.selectedActionFilter.set(action);
    this.applyActionFilter();
  }

  applyActionFilter(): void {
    const filter = this.selectedActionFilter();
    if (filter === 'all') {
      this.filteredActivities.set(this.activities());
    } else {
      this.filteredActivities.set(
        this.activities().filter(a => a.action === filter)
      );
    }
  }

  formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) return '0 B';
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
