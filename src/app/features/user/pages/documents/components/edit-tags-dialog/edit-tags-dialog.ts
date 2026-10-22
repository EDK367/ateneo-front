import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileService } from '../../../../../../core/services/file';
import { NotificationService } from '../../../../../../core/services/config/notification';
import { FileItem } from '../../documents';

export interface EditTagsDialogData {
  file: FileItem;
}

@Component({
  selector: 'app-edit-tags-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-tags-dialog.html',
  styleUrl: './edit-tags-dialog.css'
})
export class EditTagsDialog {
  private dialogRef = inject(MatDialogRef<EditTagsDialog>);
  private fileService = inject(FileService);
  private notificationService = inject(NotificationService);
  data: EditTagsDialogData = inject(MAT_DIALOG_DATA);

  tags: string[] = [...(this.data?.file?.tags || [])];
  newTag = '';
  saving = false;

  addTag(): void {
    const trimmed = this.newTag.trim();
    if (trimmed && !this.tags.includes(trimmed)) {
      this.tags.push(trimmed);
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  save(): void {
    if (this.newTag.trim()) {
      this.addTag();
    }

    this.saving = true;
    this.fileService.updateTags(this.data.file.id, this.tags).subscribe({
      next: (res) => {
        this.saving = false;
        this.notificationService.showSuccess(
          `Etiquetas del archivo "${this.data.file.name}" actualizadas`,
          'Etiquetas guardadas'
        );
        this.dialogRef.close(res?.tags || this.tags);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || 'Error al actualizar etiquetas';
        this.notificationService.showError(msg, 'Error');
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
