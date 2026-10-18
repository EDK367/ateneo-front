import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileService } from '../../../../../../core/services/file';
import { FolderService } from '../../../../../../core/services/folder';
import { NotificationService } from '../../../../../../core/services/config/notification';

export interface CreateFileDialogData {
  folderId?: string | null;
  folderName?: string;
}

@Component({
  selector: 'app-create-file-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './create-file-dialog.html',
  styleUrl: './create-file-dialog.css'
})
export class CreateFileDialog {
  private dialogRef = inject(MatDialogRef<CreateFileDialog>);
  private fileService = inject(FileService);
  private folderService = inject(FolderService);
  private notificationService = inject(NotificationService);
  data: CreateFileDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};

  selectedTab = 0;
  folderName = '';

  selectedFile: File | null = null;
  tagsString = '';
  isDragging = false;

  loading = false;

  get targetLocation(): string {
    return this.data.folderName || 'Mi Unidad';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
    input.value = '';
  }

  validateAndSetFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.md') && !name.endsWith('.txt')) {
      this.notificationService.showError('Solo se permiten archivos en formato .txt y .md', 'Formato no soportado');
      return;
    }
    this.selectedFile = file;
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  isSaveDisabled(): boolean {
    if (this.loading) return true;
    if (this.selectedTab === 0) {
      return !this.folderName.trim();
    }
    return !this.selectedFile;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.isSaveDisabled()) return;

    this.loading = true;
    const parentId = this.data.folderId || undefined;

    if (this.selectedTab === 0) {
      this.folderService.create({ name: this.folderName.trim(), parentId }).subscribe({
        next: (res) => {
          this.loading = false;
          this.notificationService.showSuccess(`Carpeta "${res.name}" creada exitosamente`, 'Carpeta creada');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          const msg = err.error?.message || 'Error al crear la carpeta';
          this.notificationService.showError(msg, 'Error');
        }
      });
    } else if (this.selectedFile) {
      const tags = this.tagsString
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      this.fileService.upload(this.selectedFile, parentId, tags).subscribe({
        next: (res) => {
          this.loading = false;
          this.notificationService.showSuccess(`Archivo "${res.name || this.selectedFile?.name}" subido exitosamente`, 'Archivo subido');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          const msg = err.error?.message || 'Error al subir el archivo';
          this.notificationService.showError(msg, 'Error');
        }
      });
    }
  }
}
