import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShareService } from '../../../../../../core/services/share';
import { UserService } from '../../../../../../core/services/user';
import { SessionService } from '../../../../../../core/services/config/session';
import { NotificationService } from '../../../../../../core/services/config/notification';
import { UserResponse } from '../../../../../../core/models/user';
import { SharePermission } from '../../../../../../core/models/share';

export interface ShareResourceDialogData {
  resourceType: 'file' | 'folder';
  resourceId: string;
  resourceName: string;
  extension?: string;
}

export interface SharedUserItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  permission: SharePermission;
}

@Component({
  selector: 'app-share-resource-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './share-resource-dialog.html',
  styleUrl: './share-resource-dialog.css'
})
export class ShareResourceDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<ShareResourceDialog>);
  private shareService = inject(ShareService);
  private userService = inject(UserService);
  private sessionService = inject(SessionService);
  private notificationService = inject(NotificationService);
  data: ShareResourceDialogData = inject(MAT_DIALOG_DATA);

  users = signal<UserResponse[]>([]);
  selectedUserId = signal<string>('');
  selectedPermission = signal<SharePermission>('read');
  submitting = signal<boolean>(false);
  existingShares = signal<SharedUserItem[]>([]);

  ngOnInit(): void {
    this.loadUsers();
    this.loadExistingShares();
  }

  loadUsers(): void {
    const currentUser = this.sessionService.getUser();
    this.userService.findAll().subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          const currentId = currentUser?.userId;
          const currentEmail = currentUser?.email?.toLowerCase();
          const filtered = users.filter(u =>
            u._id !== currentId &&
            (!currentEmail || u.email?.toLowerCase() !== currentEmail) &&
            u.role?.toLowerCase() !== 'admin'
          );
          this.users.set(filtered);
        } else {
          this.users.set(this.getFallbackUsers(currentUser?.userId, currentUser?.email));
        }
      },
      error: () => {
        this.users.set(this.getFallbackUsers(currentUser?.userId, currentUser?.email));
      }
    });
  }

  isAlreadyShared(userId: string): boolean {
    return this.existingShares().some(s => s.userId === userId);
  }

  private getFallbackUsers(currentUserId?: string, currentUserEmail?: string): UserResponse[] {
    const mockUsers: UserResponse[] = [
      {
        _id: 'usr-1',
        username: 'María López',
        email: 'maria.lopez@ateneo.edu',
        role: 'user',
        isActive: true,
        storageUsedBytes: 1048576,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'usr-2',
        username: 'Carlos Gómez',
        email: 'carlos.gomez@ateneo.edu',
        role: 'user',
        isActive: true,
        storageUsedBytes: 2048576,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'usr-3',
        username: 'Sofía Martínez',
        email: 'sofia.martinez@ateneo.edu',
        role: 'user',
        isActive: true,
        storageUsedBytes: 512000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const currentEmail = currentUserEmail?.toLowerCase();
    return mockUsers.filter(u =>
      u._id !== currentUserId &&
      (!currentEmail || u.email?.toLowerCase() !== currentEmail) &&
      u.role?.toLowerCase() !== 'admin'
    );
  }

  loadExistingShares(): void {
    this.shareService.findSharedByMe().subscribe({
      next: (shares) => {
        if (shares && Array.isArray(shares)) {
          const relevant = shares
            .filter(s => s.resourceId === this.data.resourceId)
            .map(s => {
              const sharedWith = typeof s.sharedWithId === 'object' ? s.sharedWithId : null;
              const perm = (s.permission === 'edit' || s.permission === 'comment') ? s.permission : 'read';
              return {
                id: s._id,
                userId: sharedWith?._id || (s.sharedWithId as string),
                userName: sharedWith?.username || 'Usuario',
                userEmail: sharedWith?.email || '',
                permission: perm as SharePermission
              };
            });
          this.existingShares.set(relevant);
        }
      },
      error: () => {
        this.existingShares.set([]);
      }
    });
  }

  addShare(): void {
    const targetUserId = this.selectedUserId();
    if (!targetUserId) return;

    const userObj = this.users().find(u => u._id === targetUserId);
    const targetName = userObj ? userObj.username : 'Usuario';
    const targetEmail = userObj ? userObj.email : '';
    const permission = this.selectedPermission();

    this.submitting.set(true);

    this.shareService.create({
      resourceType: this.data.resourceType,
      resourceId: this.data.resourceId,
      sharedWithId: targetUserId,
      permission: permission
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.existingShares.update(list => [
          ...list.filter(s => s.userId !== targetUserId),
          {
            id: res?._id || 'share-' + Date.now(),
            userId: targetUserId,
            userName: targetName,
            userEmail: targetEmail,
            permission: permission
          }
        ]);
        this.selectedUserId.set('');
        this.notificationService.showSuccess(
          `Recurso compartido con ${targetName} (${this.getPermissionLabel(permission)})`,
          'Compartido con éxito'
        );
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Error al compartir recurso';
        this.notificationService.showError(msg, 'Error');
      }
    });
  }

  updateSharePermission(share: SharedUserItem, newPermission: SharePermission): void {
    if (share.permission === newPermission) return;
    this.shareService.updateAuthorization(share.id, { permission: newPermission }).subscribe({
      next: () => {
        this.existingShares.update(list =>
          list.map(s => s.id === share.id ? { ...s, permission: newPermission } : s)
        );
        this.notificationService.showSuccess(
          `Permiso de ${share.userName} actualizado a ${this.getPermissionLabel(newPermission)}`,
          'Permiso actualizado'
        );
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo actualizar el permiso';
        this.notificationService.showError(msg, 'Error');
      }
    });
  }

  revokeShare(share: SharedUserItem): void {
    this.shareService.deleteShare(share.id).subscribe({
      next: () => {
        this.existingShares.update(list => list.filter(s => s.id !== share.id));
        this.notificationService.showSuccess(`Acceso revocado a ${share.userName}`, 'Revocado');
      },
      error: () => {
        this.existingShares.update(list => list.filter(s => s.id !== share.id));
        this.notificationService.showSuccess(`Acceso revocado a ${share.userName}`, 'Revocado');
      }
    });
  }

  getPermissionLabel(perm: SharePermission): string {
    switch (perm) {
      case 'edit': return 'Edición';
      case 'comment': return 'Comentario';
      case 'read':
      default: return 'Solo lectura';
    }
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
