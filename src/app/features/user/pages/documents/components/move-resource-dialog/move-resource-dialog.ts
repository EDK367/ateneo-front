import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { forkJoin } from "rxjs";

import { FolderService } from "../../../../../../core/services/folder";
import { FileService } from "../../../../../../core/services/file";
import { NotificationService } from "../../../../../../core/services/config/notification";
import { FolderResponse } from "../../../../../../core/models/folder";

export interface MoveResourceDialogData {
  type: "file" | "folder" | "batch-files";
  id?: string;
  name: string;
  currentFolderId?: string | null;
  fileIds?: string[];
  extension?: string;
}

interface DialogCrumb {
  id: string | null;
  name: string;
}

@Component({
  selector: "app-move-resource-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: "./move-resource-dialog.html",
  styleUrl: "./move-resource-dialog.css"
})
export class MoveResourceDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<MoveResourceDialog>);
  private folderService = inject(FolderService);
  private fileService = inject(FileService);
  private notificationService = inject(NotificationService);
  data: MoveResourceDialogData = inject(MAT_DIALOG_DATA);

  currentBrowsingFolderId: string | null = null;
  breadcrumbs: DialogCrumb[] = [{ id: null, name: "Mi Unidad" }];

  folders: FolderResponse[] = [];
  loadingFolders = false;
  moving = false;

  selectedTargetId: string | null = null;
  selectedTargetName = "Mi Unidad (Raíz)";

  searchQuery = "";

  ngOnInit(): void {
    this.selectedTargetId = null;
    this.selectedTargetName = "Mi Unidad (Raíz)";
    this.loadFolders(null);
  }

  loadFolders(folderId: string | null): void {
    this.loadingFolders = true;
    this.currentBrowsingFolderId = folderId;

    this.folderService.getContent(folderId).subscribe({
      next: (content) => {
        this.loadingFolders = false;
        this.folders = content?.folders || [];
      },
      error: (err) => {
        this.loadingFolders = false;
        this.folders = [];
        console.error("Error al cargar carpetas para mover", err);
      }
    });
  }

  navigateToCrumb(crumb: DialogCrumb, index: number): void {
    if (this.currentBrowsingFolderId === crumb.id) return;
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
    this.loadFolders(crumb.id);
    this.selectedTargetId = crumb.id;
    this.selectedTargetName = crumb.name === "Mi Unidad" ? "Mi Unidad (Raíz)" : crumb.name;
  }

  navigateUp(): void {
    if (this.breadcrumbs.length > 1) {
      const parentIndex = this.breadcrumbs.length - 2;
      this.navigateToCrumb(this.breadcrumbs[parentIndex], parentIndex);
    }
  }

  enterFolder(folder: FolderResponse, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.isFolderDisabled(folder)) return;

    this.breadcrumbs.push({ id: folder._id, name: folder.name });
    this.selectedTargetId = folder._id;
    this.selectedTargetName = folder.name;
    this.loadFolders(folder._id);
  }

  selectTarget(folder: FolderResponse, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.isFolderDisabled(folder)) return;

    this.selectedTargetId = folder._id;
    this.selectedTargetName = folder.name;
  }

  selectCurrentLevel(): void {
    const currentCrumb = this.breadcrumbs[this.breadcrumbs.length - 1];
    this.selectedTargetId = currentCrumb.id;
    this.selectedTargetName = currentCrumb.id === null ? "Mi Unidad (Raíz)" : currentCrumb.name;
  }

  isFolderDisabled(folder: FolderResponse): boolean {
    if (this.data.type === "folder" && this.data.id) {
      if (folder._id === this.data.id) return true;
      if (folder.ancestors && folder.ancestors.includes(this.data.id)) return true;
    }
    return false;
  }

  isCurrentLocation(): boolean {
    const currentId = this.data.currentFolderId ?? null;
    return this.selectedTargetId === currentId;
  }

  isMoveDisabled(): boolean {
    if (this.moving || this.loadingFolders) return true;
    if (this.isCurrentLocation()) return true;
    return false;
  }

  filteredFolders(): FolderResponse[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.folders;
    return this.folders.filter(f => f.name.toLowerCase().includes(q));
  }

  executeMove(): void {
    if (this.isMoveDisabled()) return;

    this.moving = true;
    const targetId = this.selectedTargetId;
    const targetName = this.selectedTargetName;

    if (this.data.type === "folder" && this.data.id) {
      this.folderService.move(this.data.id, { newParentId: targetId }).subscribe({
        next: (res) => {
          this.moving = false;
          this.notificationService.showSuccess(
            `Carpeta "${res.name}" movida con éxito a ${targetName}`,
            "Carpeta movida"
          );
          this.dialogRef.close({ moved: true, targetId });
        },
        error: (err) => {
          this.moving = false;
          const msg = err?.error?.message || "Error al mover la carpeta";
          this.notificationService.showError(msg, "Error al mover");
        }
      });
    } else if (this.data.type === "file" && this.data.id) {
      this.fileService.move(this.data.id, { folderId: targetId }).subscribe({
        next: (res) => {
          this.moving = false;
          this.notificationService.showSuccess(
            `Archivo "${res.name}" movido con éxito a ${targetName}`,
            "Archivo movido"
          );
          this.dialogRef.close({ moved: true, targetId });
        },
        error: (err) => {
          this.moving = false;
          const msg = err?.error?.message || "Error al mover el archivo";
          this.notificationService.showError(msg, "Error al mover");
        }
      });
    } else if (this.data.type === "batch-files" && this.data.fileIds && this.data.fileIds.length > 0) {
      const requests = this.data.fileIds.map(id =>
        this.fileService.move(id, { folderId: targetId })
      );

      forkJoin(requests).subscribe({
        next: (results) => {
          this.moving = false;
          this.notificationService.showSuccess(
            `${results.length} archivos movidos con éxito a ${targetName}`,
            "Archivos movidos"
          );
          this.dialogRef.close({ moved: true, targetId });
        },
        error: (err) => {
          this.moving = false;
          const msg = err?.error?.message || "Error al mover algunos archivos";
          this.notificationService.showError(msg, "Error al mover");
          this.dialogRef.close({ moved: true, targetId });
        }
      });
    }
  }

  close(): void {
    this.dialogRef.close({ moved: false });
  }
}
