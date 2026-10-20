import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserService, CreateUserPayload } from '../../../../core/services/user';
import { NotificationService } from '../../../../core/services/config/notification';
import { UserResponse, UserRole } from '../../../../core/models/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);

  private routerSub: Subscription | null = null;

  allUsers: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  paginatedUsers: UserResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: 'username' | 'email' | 'createdAt' | 'storageUsedBytes' = 'createdAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  includeInactive = false;

  searchTerm = '';
  loading = true;
  saving = false;

  isModalOpen = false;
  isEditMode = false;
  editingUser: UserResponse | null = null;
  showPassword = false;
  modalError: string | null = null;

  userForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
    role: ['user', [Validators.required]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openCreateModal();
      }
    });

    this.loadUsers();

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/admin/users')) {
          this.loadUsers();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.findAll().subscribe({
      next: (users: UserResponse[]) => {
        this.allUsers = Array.isArray(users) ? users : [];
        this.applyFilterAndPagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.allUsers = [];
        this.applyFilterAndPagination();
        this.loading = false;
        this.notificationService.showError('No se pudo cargar la lista de usuarios', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  applyFilterAndPagination(): void {
    let result = [...this.allUsers];

    if (!this.includeInactive) {
      result = result.filter(u => u.isActive !== false);
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(u => {
        const userMatch = u.username?.toLowerCase().includes(term) ?? false;
        const emailMatch = u.email?.toLowerCase().includes(term) ?? false;
        const roleMatch = u.role?.toLowerCase().includes(term) ?? false;
        const idMatch = u._id?.toLowerCase().includes(term) ?? false;
        return userMatch || emailMatch || roleMatch || idMatch;
      });
    }

    result.sort((a, b) => {
      let valA: any = a[this.sortField];
      let valB: any = b[this.sortField];

      if (this.sortField === 'storageUsedBytes') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (this.sortField === 'createdAt') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return this.sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    this.filteredUsers = result;
    this.totalElements = result.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = result.slice(start, end);
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSortFieldChange(newField: 'username' | 'email' | 'createdAt' | 'storageUsedBytes'): void {
    this.sortField = newField;
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  onIncludeInactiveChange(include: boolean): void {
    this.includeInactive = include;
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.applyFilterAndPagination();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingUser = null;
    this.showPassword = false;
    this.modalError = null;
    this.userForm.reset({
      username: '',
      email: '',
      password: '',
      role: 'user',
      isActive: true
    });

    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.isModalOpen = true;
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.editingUser = user;
    this.showPassword = false;
    this.modalError = null;

    this.userForm.get('password')?.setValidators([Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.userForm.patchValue({
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      isActive: user.isActive !== false
    });

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingUser = null;
    this.modalError = null;
    this.userForm.reset();

    if (this.route.snapshot.queryParams['action']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.modalError = null;
    const formVal = this.userForm.value;
    const payload: CreateUserPayload = {
      username: formVal.username.trim(),
      email: formVal.email.trim(),
      role: formVal.role,
      isActive: formVal.isActive
    };

    if (formVal.password && formVal.password.trim().length > 0) {
      payload.password = formVal.password.trim();
    }

    this.saving = true;

    if (this.isEditMode && this.editingUser?._id) {
      const targetId = this.editingUser._id;
      this.userService.updateUser(targetId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.notificationService.showSuccess('Usuario actualizado correctamente', 'Éxito');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = err?.error?.message || 'Error al actualizar usuario en el backend';
          this.cdr.detectChanges();
        }
      });
    } else {
      if (!payload.password) {
        this.saving = false;
        this.notificationService.showError('La contraseña es requerida para registrar el usuario', 'Validación');
        return;
      }

      this.userService.createUser(payload).subscribe({
        next: () => {
          this.saving = false;
          this.notificationService.showSuccess('Usuario registrado con éxito', 'Éxito');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = err?.error?.message || 'Error al crear usuario en el backend';
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleUserStatus(user: UserResponse): void {
    if (!user._id) return;

    if (user.isActive !== false) {
      if (confirm(`¿Está seguro de desactivar al usuario "${user.username}"?`)) {
        this.userService.deleteUser(user._id).subscribe({
          next: () => {
            user.isActive = false;
            this.notificationService.showSuccess(`Usuario ${user.username} desactivado correctamente`, 'Operación exitosa');
            this.applyFilterAndPagination();
          },
          error: (err) => {
            this.notificationService.showError(err?.error?.message || 'No se pudo desactivar el usuario', 'Error');
          }
        });
      }
    } else {
      if (confirm(`¿Está seguro de reactivar al usuario "${user.username}"?`)) {
        this.userService.updateUser(user._id, { isActive: true }).subscribe({
          next: () => {
            user.isActive = true;
            this.notificationService.showSuccess(`Usuario ${user.username} reactivado correctamente`, 'Operación exitosa');
            this.applyFilterAndPagination();
          },
          error: (err) => {
            this.notificationService.showError(err?.error?.message || 'No se pudo reactivar el usuario', 'Error');
          }
        });
      }
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
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

  getRoleBadgeClass(role?: string): string {
    return role === 'admin'
      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  }

  getRoleLabel(role?: string): string {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  }
}
