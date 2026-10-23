import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FolderService } from '../../../../../../core/services/folder';
import { FileService } from '../../../../../../core/services/file';
import { NotificationService } from '../../../../../../core/services/config/notification';

export interface RenameDialogData {
  type: 'folder' | 'file';
  id: string;
  currentName: string;
  extension?: 'md' | 'txt';
}

@Component({
  selector: 'app-rename-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './rename-dialog.html',
  styleUrl: './rename-dialog.css'
})
export class RenameDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<RenameDialog>);
  private folderService = inject(FolderService);
  private fileService = inject(FileService);
  private notificationService = inject(NotificationService);
  data: RenameDialogData = inject(MAT_DIALOG_DATA);

  name = '';
  saving = false;

  ngOnInit(): void {
    if (this.data.type === 'file' && this.data.extension) {
      const extSuffix = '.' + this.data.extension;
      if (this.data.currentName.toLowerCase().endsWith(extSuffix.toLowerCase())) {
        this.name = this.data.currentName.slice(0, -extSuffix.length);
      } else {
        this.name = this.data.currentName;
      }
    } else {
      this.name = this.data.currentName;
    }
  }

  isSaveDisabled(): boolean {
    return this.saving || !this.name.trim();
  }

  save(): void {
    const trimmed = this.name.trim();
    if (!trimmed || this.saving) return;

    this.saving = true;

    if (this.data.type === 'folder') {
      this.folderService.rename(this.data.id, { name: trimmed }).subscribe({
        next: (res) => {
          this.saving = false;
          this.notificationService.showSuccess(
            'Carpeta renombrada a "' + res.name + '"',
            'Renombrado'
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Error al renombrar la carpeta';
          this.notificationService.showError(msg, 'Error');
        }
      });
    } else {
      const ext = this.data.extension || 'txt';
      const targetName = trimmed.toLowerCase().endsWith('.' + ext) ? trimmed : trimmed + '.' + ext;

      this.fileService.rename(this.data.id, { name: targetName }).subscribe({
        next: (res) => {
          this.saving = false;
          this.notificationService.showSuccess(
            'Archivo renombrado a "' + res.name + '"',
            'Renombrado'
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Error al renombrar el archivo';
          this.notificationService.showError(msg, 'Error');
        }
      });
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
