import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TokenService } from '../../../../core/services/config/token';
import { SessionService } from '../../../../core/services/config/session';
import { ROLE_MENUS, RoleMenuConfig } from './sidebar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private tokenService = inject(TokenService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  readonly currentRole = computed(() => {
    const role = this.sessionService.getRole();
    if (role) {
      return role.toLowerCase();
    }
    return this.router.url.startsWith('/user') ? 'user' : 'admin';
  });

  readonly menuConfig = computed<RoleMenuConfig>(() => {
    const role = this.currentRole();
    return ROLE_MENUS[role] || ROLE_MENUS['admin'];
  });

  onMenuClick(route: string): void {
    if (this.router.url.split('?')[0] !== route.split('?')[0]) {
      this.router.navigateByUrl(route);
    }
  }

  onLogout(): void {
    this.tokenService.clearTokens();
    this.sessionService.clearUser();
    this.router.navigate(['/login']);
  }
}
