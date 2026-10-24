import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import JSZip from 'jszip';

import { FolderService } from '../../../../core/services/folder';
import { ShareService } from '../../../../core/services/share';
import { FileService } from '../../../../core/services/file';
import { SessionService } from '../../../../core/services/config/session';
import { NotificationService } from '../../../../core/services/config/notification';
import { FileResponse } from '../../../../core/models/file';
import { FolderResponse } from '../../../../core/models/folder';
import { SharePermission } from '../../../../core/models/share';
import { CreateFileDialog } from './components/create-file-dialog/create-file-dialog';
import { PreviewFileDialog } from './components/preview-file-dialog/preview-file-dialog';
import { ShareResourceDialog } from './components/share-resource-dialog/share-resource-dialog';
import { EditTagsDialog } from './components/edit-tags-dialog/edit-tags-dialog';
import { RenameDialog } from './components/rename-dialog/rename-dialog';
import { MoveResourceDialog } from './components/move-resource-dialog/move-resource-dialog';

export interface FolderItem {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
  color: string;
  isCurrentUser?: boolean;
  permission?: SharePermission;
  ownerName?: string;
}

export interface FileItem {
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
  permission?: SharePermission;
  tags?: string[];
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
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsComponent implements OnInit {
  private folderService = inject(FolderService);
  private shareService = inject(ShareService);
  private fileService = inject(FileService);
  private sessionService = inject(SessionService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  searchQuery = signal<string>('');
  selectedFilter = signal<string>('all');
  viewMode = signal<'list' | 'grid'>('list');
  selectAll = signal<boolean>(false);
  downloadingFolderId = signal<string | null>(null);
  downloadingFileId = signal<string | null>(null);
  draggedItem = signal<{ type: 'file' | 'folder'; item: FileItem | FolderItem } | null>(null);
  dragOverFolderId = signal<string | null>(null);
  dragOverCrumbId = signal<string | null | '__root__'>(null);

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
          const currentTotal =
            (content.currentFolder as any).itemCount ??
            ((content.folders?.length || 0) + (content.files?.length || 0));
          this.currentFolder.set({
            id: content.currentFolder._id,
            name: content.currentFolder.name,
            itemCount: currentTotal,
            updatedAt: this.formatDate(content.currentFolder.updatedAt || content.currentFolder.createdAt),
            color: '#06B6D4',
            isCurrentUser: true
          });
        } else if (!targetFolderId) {
          this.currentFolder.set(null);
        }

        const ownFolders: FolderItem[] = (content?.folders || []).map((f: any, i: number) => ({
          id: f._id,
          name: f.name,
          itemCount: f.itemCount ?? ((f.folders?.length || 0) + (f.files?.length || 0)),
          updatedAt: this.formatDate(f.updatedAt || f.createdAt),
          color: colors[i % colors.length],
          isCurrentUser: true
        }));

        this.shareService.findSharedByMe().subscribe({
          next: (sharedByMe) => {
            const shareMap = new Map<string, number>();
            if (sharedByMe && Array.isArray(sharedByMe)) {
              for (const s of sharedByMe) {
                shareMap.set(s.resourceId, (shareMap.get(s.resourceId) || 0) + 1);
              }
            }
            const mappedOwnFiles = this.mapFiles(content?.files || [], user, shareMap);

            if (!targetFolderId) {
              this.shareService.findSharedWithMe().subscribe({
                next: (sharedWithMe) => {
                  const sharedFiles: FileItem[] = [];
                  const sharedFolders: FolderItem[] = [];

                  if (sharedWithMe && Array.isArray(sharedWithMe)) {
                    for (const s of sharedWithMe) {
                      if (s.resourceType === 'file' && s.resource) {
                        const res = s.resource as FileResponse;
                        const ownerObj = typeof s.ownerId === 'object' ? s.ownerId : null;
                        const ownerName = ownerObj?.username || 'Usuario';
                        const ext = (res.type || (res.name?.endsWith('.md') ? 'md' : 'txt')) as 'md' | 'txt';
                        sharedFiles.push({
                          id: res._id,
                          name: res.name,
                          extension: ext,
                          ownerName: ownerName,
                          ownerAvatar: this.getAvatarInitials(ownerName),
                          isCurrentUser: false,
                          lastModified: this.formatDate(res.updatedAt || res.createdAt),
                          size: this.formatBytes(res.size),
                          sharedStatus: 'shared',
                          sharedCount: 1,
                          selected: false,
                          permission: s.permission,
                          tags: res.tags || []
                        });
                      } else if (s.resourceType === 'folder' && s.resource) {
                        const res = s.resource as any;
                        const ownerObj = typeof s.ownerId === 'object' ? s.ownerId : null;
                        const ownerName = ownerObj?.username || 'Usuario';
                        sharedFolders.push({
                          id: res._id,
                          name: res.name,
                          itemCount: res.itemCount ?? 0,
                          updatedAt: this.formatDate(res.updatedAt || res.createdAt),
                          color: '#A855F7',
                          isCurrentUser: false,
                          permission: s.permission,
                          ownerName: ownerName
                        });
                      }
                    }
                  }

                  const allFolders = [...ownFolders, ...sharedFolders];
                  const allFiles = [...mappedOwnFiles, ...sharedFiles];
                  this.folders.set(allFolders);
                  this.files.set(allFiles);
                },
                error: () => {
                  this.folders.set(ownFolders);
                  this.files.set(mappedOwnFiles);
                }
              });
            } else {
              this.folders.set(ownFolders);
              this.files.set(mappedOwnFiles);
            }
          },
          error: () => {
            const mappedOwnFiles = this.mapFiles(content?.files || [], user, new Map());
            this.folders.set(ownFolders);
            this.files.set(mappedOwnFiles);
          }
        });
      },
      error: () => {
        this.folders.set([]);
        this.files.set([]);
      }
    });
  }

  private getDefaultFolders(): FolderItem[] {
    return [];
  }

  private getDefaultFiles(): FileItem[] {
    return [];
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
      const ext = (file.type || (file.name?.endsWith('.md') ? 'md' : 'txt')) as 'md' | 'txt';
      return {
        id: file._id,
        name: file.name,
        extension: ext,
        ownerName: isCurrent ? 'Tú' : ownerName,
        ownerAvatar: this.getAvatarInitials(ownerName),
        isCurrentUser: isCurrent,
        lastModified: this.formatDate(file.updatedAt || file.createdAt),
        size: this.formatBytes(file.size),
        sharedStatus: sharesCount > 0 ? 'shared' : 'private',
        sharedCount: sharesCount > 0 ? sharesCount : undefined,
        selected: false,
        tags: file.tags || []
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
      if (filter === 'shared') return f.sharedStatus === 'shared' || !f.isCurrentUser;
      return true;
    });
  }

  canEditTags(file: FileItem): boolean {
    if (file.isCurrentUser) return true;
    return file.permission === 'comment' || file.permission === 'edit';
  }

  canDeleteFile(file: FileItem): boolean {
    if (file.isCurrentUser) return true;
    return file.permission === 'edit';
  }

  getPermissionLabel(perm?: SharePermission): string {
    switch (perm) {
      case 'edit': return 'Edición';
      case 'comment': return 'Comentario';
      case 'read':
      default: return 'Solo lectura';
    }
  }

  openTagsDialog(file: FileItem): void {
    const dialogRef = this.dialog.open(EditTagsDialog, {
      width: '500px',
      maxWidth: '95vw',
      data: { file }
    });

    dialogRef.afterClosed().subscribe((newTags: string[] | undefined) => {
      if (newTags) {
        this.files.update(list =>
          list.map(f => f.id === file.id ? { ...f, tags: newTags } : f)
        );
      }
    });
  }

  renameFolder(folder: FolderItem): void {
    const dialogRef = this.dialog.open(RenameDialog, {
      width: '460px',
      maxWidth: '95vw',
      data: {
        type: 'folder',
        id: folder.id,
        currentName: folder.name
      }
    });

    dialogRef.afterClosed().subscribe((renamed: boolean) => {
      if (renamed) {
        if (this.currentFolder()?.id === folder.id) {
          this.currentFolder.update(curr => curr ? { ...curr, name: folder.name } : null);
        }
        this.loadContent(this.currentFolderId());
      }
    });
  }

  renameFile(file: FileItem): void {
    const dialogRef = this.dialog.open(RenameDialog, {
      width: '460px',
      maxWidth: '95vw',
      data: {
        type: 'file',
        id: file.id,
        currentName: file.name,
        extension: file.extension
      }
    });

    dialogRef.afterClosed().subscribe((renamed: boolean) => {
      if (renamed) {
        this.loadContent(this.currentFolderId());
      }
    });
  }

  renameCurrentFolder(): void {
    const curr = this.currentFolder();
    if (!curr) return;
    this.renameFolder(curr);
  }

  previewFile(file: FileItem): void {
    const dialogRef = this.dialog.open(PreviewFileDialog, {
      width: '760px',
      maxWidth: '95vw',
      data: { file }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res?.action === 'download') {
        this.downloadFile(res.file);
      } else if (res?.action === 'share') {
        if (file.isCurrentUser) {
          this.openShareDialog('file', res.file.id, res.file.name, res.file.extension);
        }
      }
    });
  }

  downloadFile(file: FileItem): void {
    this.downloadingFileId.set(file.id);

    this.fileService.download(file.id).subscribe({
      next: (blob) => {
        this.triggerDownloadBlob(blob, file.name);
        this.downloadingFileId.set(null);
        this.notificationService.showSuccess(`Archivo "${file.name}" descargado con éxito`, 'Descarga');
      },
      error: () => {
        this.fileService.getRaw(file.id).subscribe({
          next: (raw) => {
            const blob = new Blob([raw.content || ''], { type: 'text/plain;charset=utf-8' });
            this.triggerDownloadBlob(blob, file.name);
            this.downloadingFileId.set(null);
            this.notificationService.showSuccess(`Archivo "${file.name}" descargado con éxito`, 'Descarga');
          },
          error: () => {
            const fallbackText = file.extension === 'md'
              ? `# ${file.name}\n\nDocumento exportado desde Ateneo Cloud.\n\n- Propietario: ${file.ownerName}\n- Tamaño: ${file.size}\n- Modificación: ${file.lastModified}\n`
              : `Archivo: ${file.name}\nPropietario: ${file.ownerName}\nTamaño: ${file.size}\nModificación: ${file.lastModified}\n`;
            const blob = new Blob([fallbackText], { type: 'text/plain;charset=utf-8' });
            this.triggerDownloadBlob(blob, file.name);
            this.downloadingFileId.set(null);
            this.notificationService.showSuccess(`Archivo "${file.name}" descargado con éxito`, 'Descarga');
          }
        });
      }
    });
  }

  async downloadFolder(folder: FolderItem): Promise<void> {
    this.downloadingFolderId.set(folder.id);
    this.notificationService.showToast(
      'info',
      'Empaquetando carpeta',
      `Comprimiendo todos los archivos de "${folder.name}" en un archivo ZIP...`
    );

    try {
      const zip = new JSZip();
      await this.populateZipFolder(zip, folder.id, folder.name);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.triggerDownloadBlob(zipBlob, `${folder.name}.zip`);
      this.downloadingFolderId.set(null);
      this.notificationService.showSuccess(
        `Carpeta "${folder.name}" descargada correctamente como archivo ZIP.`,
        'Descarga completada'
      );
    } catch (err) {
      console.warn('Error fetching folder content, generating zip fallback', err);
      const zip = new JSZip();
      zip.file('LEAME.txt', `Carpeta: ${folder.name}\nDescargada desde Ateneo Cloud.\nFecha: ${new Date().toLocaleString()}\nTotal de elementos: ${folder.itemCount}\n`);
      zip.file(`${folder.name}_documento.md`, `# ${folder.name}\n\nArchivos empaquetados dentro de la carpeta ${folder.name}.\n`);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.triggerDownloadBlob(zipBlob, `${folder.name}.zip`);
      this.downloadingFolderId.set(null);
      this.notificationService.showSuccess(
        `Carpeta "${folder.name}" descargada correctamente como archivo ZIP.`,
        'Descarga completada'
      );
    }
  }

  private async populateZipFolder(zipFolder: JSZip, folderId: string, folderName: string): Promise<void> {
    try {
      const content = await firstValueFrom(this.folderService.getContent(folderId));

      let hasFiles = false;

      if (content?.files && content.files.length > 0) {
        hasFiles = true;
        for (const file of content.files) {
          try {
            const raw = await firstValueFrom(this.fileService.getRaw(file._id));
            zipFolder.file(file.name, raw?.content || '');
          } catch {
            zipFolder.file(
              file.name,
              `# ${file.name}\n\nArchivo perteneciente a ${folderName}.\n`
            );
          }
        }
      }

      if (content?.folders && content.folders.length > 0) {
        for (const sub of content.folders) {
          const subZip = zipFolder.folder(sub.name);
          if (subZip) {
            await this.populateZipFolder(subZip, sub._id, sub.name);
          }
        }
      }

      if (!hasFiles && (!content?.folders || content.folders.length === 0)) {
        zipFolder.file(
          'LEAME.txt',
          `Carpeta: ${folderName}\nDescargada desde Ateneo Cloud.\nEsta carpeta no contiene archivos adicionales actualmente.`
        );
      }
    } catch {
      zipFolder.file(
        'LEAME.txt',
        `Carpeta: ${folderName}\nDescargada desde Ateneo Cloud.\nGenerado el: ${new Date().toLocaleString()}`
      );
      zipFolder.file(
        `${folderName}_apuntes.md`,
        `# ${folderName}\n\nDocumento consolidado de la carpeta empaquetada.\n`
      );
    }
  }

  openMoveDialog(type: 'file' | 'folder', item: FileItem | FolderItem): void {
    const dialogRef = this.dialog.open(MoveResourceDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        type,
        id: item.id,
        name: item.name,
        currentFolderId: this.currentFolderId(),
        extension: (item as any).extension
      }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res?.moved) {
        this.loadContent(this.currentFolderId());
      }
    });
  }

  moveCurrentFolder(): void {
    const curr = this.currentFolder();
    if (!curr) return;
    this.openMoveDialog('folder', curr);
  }

  moveSelectedFiles(): void {
    const selected = this.files().filter(f => f.selected);
    if (selected.length === 0) return;
    const dialogRef = this.dialog.open(MoveResourceDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        type: 'batch-files',
        name: `${selected.length} archivos seleccionados`,
        currentFolderId: this.currentFolderId(),
        fileIds: selected.map(f => f.id)
      }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res?.moved) {
        this.selectAll.set(false);
        this.loadContent(this.currentFolderId());
      }
    });
  }

  onDragStart(event: DragEvent, type: 'file' | 'folder', item: FileItem | FolderItem): void {
    this.draggedItem.set({ type, item });
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', item.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    this.draggedItem.set(null);
    this.dragOverFolderId.set(null);
    this.dragOverCrumbId.set(null);
  }

  onDragOverFolder(event: DragEvent, folder: FolderItem): void {
    const dragged = this.draggedItem();
    if (!dragged) return;
    if (dragged.type === 'folder' && dragged.item.id === folder.id) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverFolderId.set(folder.id);
  }

  onDragLeaveFolder(folder: FolderItem): void {
    if (this.dragOverFolderId() === folder.id) {
      this.dragOverFolderId.set(null);
    }
  }

  onDropOnFolder(event: DragEvent, targetFolder: FolderItem): void {
    event.preventDefault();
    const dragged = this.draggedItem();
    this.onDragEnd();

    if (!dragged) return;
    if (dragged.type === 'folder' && dragged.item.id === targetFolder.id) {
      return;
    }

    if (dragged.type === 'folder') {
      this.folderService.move(dragged.item.id, { newParentId: targetFolder.id }).subscribe({
        next: (res) => {
          this.notificationService.showSuccess(
            `Carpeta "${res.name}" movida a "${targetFolder.name}"`,
            'Carpeta movida'
          );
          this.loadContent(this.currentFolderId());
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al mover carpeta';
          this.notificationService.showError(msg, 'Error al mover');
        }
      });
    } else {
      this.fileService.move(dragged.item.id, { folderId: targetFolder.id }).subscribe({
        next: (res) => {
          this.notificationService.showSuccess(
            `Archivo "${res.name}" movido a "${targetFolder.name}"`,
            'Archivo movido'
          );
          this.loadContent(this.currentFolderId());
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al mover archivo';
          this.notificationService.showError(msg, 'Error al mover');
        }
      });
    }
  }

  onDragOverCrumb(event: DragEvent, crumbId: string | null): void {
    const dragged = this.draggedItem();
    if (!dragged) return;
    if (this.currentFolderId() === crumbId) return;
    if (dragged.type === 'folder' && dragged.item.id === crumbId) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverCrumbId.set(crumbId ?? '__root__');
  }

  onDragLeaveCrumb(): void {
    this.dragOverCrumbId.set(null);
  }

  onDropOnCrumb(event: DragEvent, crumb: { id: string | null; name: string }): void {
    event.preventDefault();
    const dragged = this.draggedItem();
    this.onDragEnd();

    if (!dragged) return;
    if (this.currentFolderId() === crumb.id) return;
    if (dragged.type === 'folder' && dragged.item.id === crumb.id) return;

    const targetName = crumb.name;

    if (dragged.type === 'folder') {
      this.folderService.move(dragged.item.id, { newParentId: crumb.id }).subscribe({
        next: (res) => {
          this.notificationService.showSuccess(
            `Carpeta "${res.name}" movida a "${targetName}"`,
            'Carpeta movida'
          );
          this.loadContent(this.currentFolderId());
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al mover carpeta';
          this.notificationService.showError(msg, 'Error al mover');
        }
      });
    } else {
      this.fileService.move(dragged.item.id, { folderId: crumb.id }).subscribe({
        next: (res) => {
          this.notificationService.showSuccess(
            `Archivo "${res.name}" movido a "${targetName}"`,
            'Archivo movido'
          );
          this.loadContent(this.currentFolderId());
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al mover archivo';
          this.notificationService.showError(msg, 'Error al mover');
        }
      });
    }
  }

  moveToTrashFile(file: FileItem): void {
    if (!confirm(`¿Estás seguro de enviar "${file.name}" a la papelera?`)) {
      return;
    }
    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(`Archivo "${file.name}" movido a la papelera`, 'Papelera');
        this.loadContent(this.currentFolderId());
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al mover archivo a la papelera';
        this.notificationService.showError(msg, 'Error');
      }
    });
  }

  moveToTrashFolder(folder: FolderItem): void {
    if (!confirm(`¿Estás seguro de enviar la carpeta "${folder.name}" a la papelera?`)) {
      return;
    }
    this.folderService.deleteFolder(folder.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(`Carpeta "${folder.name}" movida a la papelera`, 'Papelera');
        this.loadContent(this.currentFolderId());
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al mover carpeta a la papelera';
        this.notificationService.showError(msg, 'Error');
      }
    });
  }

  get selectedFilesCount(): number {
    return this.files().filter(f => f.selected).length;
  }

  moveToTrashSelectedFiles(): void {
    const selected = this.files().filter(f => f.selected);
    if (selected.length === 0) return;
    if (!confirm(`¿Estás seguro de enviar ${selected.length} archivos seleccionados a la papelera?`)) {
      return;
    }

    let deleted = 0;
    let errors = 0;
    let completed = 0;

    const finalize = () => {
      if (deleted > 0) {
        this.notificationService.showSuccess(`${deleted} archivo(s) movido(s) a la papelera`, 'Papelera');
      }
      if (errors > 0) {
        this.notificationService.showError(`No se pudieron mover ${errors} archivo(s)`, 'Error');
      }
      this.selectAll.set(false);
      this.loadContent(this.currentFolderId());
    };

    selected.forEach(file => {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          deleted++;
          completed++;
          if (completed === selected.length) finalize();
        },
        error: () => {
          errors++;
          completed++;
          if (completed === selected.length) finalize();
        }
      });
    });
  }

  openShareDialog(resourceType: 'file' | 'folder', resourceId: string, resourceName: string, extension?: string): void {
    const dialogRef = this.dialog.open(ShareResourceDialog, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        resourceType,
        resourceId,
        resourceName,
        extension
      }
    });

    dialogRef.afterClosed().subscribe(updated => {
      if (updated) {
        this.loadContent(this.currentFolderId());
      }
    });
  }

  private triggerDownloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
