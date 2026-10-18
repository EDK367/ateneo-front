import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FolderService } from '../../../../core/services/folder';
import { ShareService } from '../../../../core/services/share';
import { SessionService } from '../../../../core/services/config/session';
import { FileResponse } from '../../../../core/models/file';
import { CreateFileDialog } from './components/create-file-dialog/create-file-dialog';

interface FolderItem {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
  color: string;
}

interface FileItem {
  id: string;
  name: string;
  extension: 'md' | 'txt';
  ownerName: string;
  ownerAvatar: string;
  isCurrentUser: boolean;
  lastModified: string;
  size: string;
  sharedStatus: 'shared' | 'private';
  sharedCount?: number;
  selected?: boolean;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsComponent implements OnInit {
  private folderService = inject(FolderService);
  private shareService = inject(ShareService);
  private sessionService = inject(SessionService);
  private dialog = inject(MatDialog);

  searchQuery = signal<string>('');
  selectedFilter = signal<string>('all');
  viewMode = signal<'list' | 'grid'>('list');
  selectAll = signal<boolean>(false);

  filters = [
    { id: 'all', label: 'Todos' },
    { id: 'md', label: 'Documentos (.md)' },
    { id: 'txt', label: 'Archivos (.txt)' },
    { id: 'shared', label: 'Compartidos' }
  ];

  folders = signal<FolderItem[]>([]);
  files = signal<FileItem[]>([]);
  currentFolderId = signal<string | null>(null);
  currentFolder = signal<FolderItem | null>(null);
  breadcrumbTrail = signal<{ id: string | null; name: string }[]>([
    { id: null, name: 'Mi Unidad' }
  ]);

  ngOnInit(): void {
    this.loadContent();
  }

  openCreateFileDialog(): void {
    const dialogRef = this.dialog.open(CreateFileDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        folderId: this.currentFolderId(),
        folderName: this.currentFolder()?.name || 'Mi Unidad'
      }
    });

    dialogRef.afterClosed().subscribe(created => {
      if (created) {
        this.loadContent(this.currentFolderId());
      }
    });
  }

  loadContent(folderId?: string | null): void {
    const user = this.sessionService.getUser();
    const colors = ['#06B6D4', '#10B981', '#FB923C', '#A855F7'];
    const targetFolderId = folderId || undefined;

    this.folderService.getContent(targetFolderId).subscribe({
      next: (content) => {
        if (content?.currentFolder) {
          this.currentFolder.set({
            id: content.currentFolder._id,
            name: content.currentFolder.name,
            itemCount: (content.folders?.length || 0) + (content.files?.length || 0),
            updatedAt: this.formatDate(content.currentFolder.updatedAt || content.currentFolder.createdAt),
            color: '#06B6D4'
          });
        } else if (!targetFolderId) {
          this.currentFolder.set(null);
        }

        if (content?.folders && content.folders.length > 0) {
          const mappedFolders: FolderItem[] = content.folders.map((f, i) => ({
            id: f._id,
            name: f.name,
            itemCount: 0,
            updatedAt: this.formatDate(f.updatedAt || f.createdAt),
            color: colors[i % colors.length]
          }));
          this.folders.set(mappedFolders);
        } else {
          this.folders.set([]);
        }

        if (content?.files && content.files.length > 0) {
          this.shareService.findSharedByMe().subscribe({
            next: (shares) => {
              const shareMap = new Map<string, number>();
              if (shares && Array.isArray(shares)) {
                for (const s of shares) {
                  shareMap.set(s.resourceId, (shareMap.get(s.resourceId) || 0) + 1);
                }
              }
              const mappedFiles = this.mapFiles(content.files, user, shareMap);
              this.files.set(mappedFiles);
            },
            error: () => {
              const mappedFiles = this.mapFiles(content.files, user, new Map());
              this.files.set(mappedFiles);
            }
          });
        } else {
          this.files.set([]);
        }
      },
      error: () => {
        this.folders.set([]);
        this.files.set([]);
      }
    });
  }

  enterFolder(folder: FolderItem): void {
    this.currentFolderId.set(folder.id);
    this.currentFolder.set(folder);
    this.breadcrumbTrail.update(trail => [...trail, { id: folder.id, name: folder.name }]);
    this.loadContent(folder.id);
  }

  navigateToBreadcrumb(crumb: { id: string | null; name: string }, index: number): void {
    if (this.currentFolderId() === crumb.id) return;
    this.currentFolderId.set(crumb.id);
    this.breadcrumbTrail.update(trail => trail.slice(0, index + 1));
    if (crumb.id === null) {
      this.currentFolder.set(null);
    }
    this.loadContent(crumb.id);
  }

  navigateUp(): void {
    const trail = this.breadcrumbTrail();
    if (trail.length > 1) {
      const parentIndex = trail.length - 2;
      this.navigateToBreadcrumb(trail[parentIndex], parentIndex);
    }
  }

  private mapFiles(files: FileResponse[], user: any, shareMap: Map<string, number>): FileItem[] {
    return files.map(file => {
      const isCurrent = !user || file.ownerId === user.userId;
      const sharesCount = shareMap.get(file._id) || 0;
      const ownerName = isCurrent ? (user?.username || 'Tú') : 'Usuario';
      return {
        id: file._id,
        name: file.name,
        extension: file.type,
        ownerName: isCurrent ? 'Tú' : ownerName,
        ownerAvatar: this.getAvatarInitials(ownerName),
        isCurrentUser: isCurrent,
        lastModified: this.formatDate(file.updatedAt || file.createdAt),
        size: this.formatBytes(file.size),
        sharedStatus: sharesCount > 0 ? 'shared' : 'private',
        sharedCount: sharesCount > 0 ? sharesCount : undefined,
        selected: false
      };
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  setFilter(filterId: string): void {
    this.selectedFilter.set(filterId);
  }

  toggleView(mode: 'list' | 'grid'): void {
    this.viewMode.set(mode);
  }

  toggleSelectAll(): void {
    const next = !this.selectAll();
    this.selectAll.set(next);
    this.files.update(items => items.map(f => ({ ...f, selected: next })));
  }

  toggleSelectFile(file: FileItem): void {
    this.files.update(items =>
      items.map(f => f.id === file.id ? { ...f, selected: !f.selected } : f)
    );
    const allSelected = this.files().every(f => f.selected);
    this.selectAll.set(allSelected);
  }

  filteredFiles(): FileItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedFilter();

    return this.files().filter(f => {
      const matchesSearch = !q || f.name.toLowerCase().includes(q) || f.ownerName.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filter === 'md') return f.extension === 'md';
      if (filter === 'txt') return f.extension === 'txt';
      if (filter === 'shared') return f.sharedStatus === 'shared';
      return true;
    });
  }
}
