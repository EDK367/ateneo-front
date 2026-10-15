import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth';
import { SessionService } from '../../core/services/config/session';
import { UserProfile } from '../../core/models/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  user: UserProfile | null = null;
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const cachedUser = this.sessionService.getUser();
    if (cachedUser) {
      this.user = cachedUser;
    } else {
      const isUserRole = this.router.url.startsWith('/user');
      this.user = {
        userId: isUserRole ? 'usr-892348-user' : 'usr-102934-admin',
        username: isUserRole ? 'usuario_ateneo' : 'admin_ateneo',
        email: isUserRole ? 'usuario@ateneo.edu.gt' : 'admin@ateneo.edu.gt',
        role: isUserRole ? 'user' : 'admin'
      };
    }
    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.user) {
      this.loading = true;
    }
    this.errorMessage = null;

    this.authService.profile().subscribe({
      next: (profile) => {
        if (profile) {
          this.user = profile;
          this.sessionService.saveUser(profile);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get userInitials(): string {
    if (!this.user?.username) return 'AT';
    const name = this.user.username.trim();
    if (name.length <= 2) return name.toUpperCase();
    const parts = name.split(/[._\s-]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  get roleDisplayName(): string {
    const role = (this.user?.role || '').toLowerCase();
    switch (role) {
      case 'admin':
      case 'administration':
        return 'Administrador';
      case 'user':
      case 'usuario':
        return 'Usuario';
      default:
        return this.user?.role || 'Usuario';
    }
  }
}
