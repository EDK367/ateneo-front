import { Component, inject, computed, signal, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private tokenService = inject(TokenService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  readonly isCollapsed = signal<boolean>(false);
  readonly sidebarWidth = signal<number>(260);
  readonly isResizing = signal<boolean>(false);

  private startX = 0;
  private startWidth = 260;

  @HostBinding('style.width.px')
  get hostWidth(): number {
    return this.isCollapsed() ? 76 : this.sidebarWidth();
  }

  @HostBinding('class.collapsed')
  get hostCollapsed(): boolean {
    return this.isCollapsed();
  }

  @HostBinding('class.resizing')
  get hostResizing(): boolean {
    return this.isResizing();
  }

  constructor() {
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed !== null) {
      this.isCollapsed.set(savedCollapsed === 'true');
    }
    const savedWidth = localStorage.getItem('sidebar_width');
    if (savedWidth !== null) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 180 && parsed <= 450) {
        this.sidebarWidth.set(parsed);
      }
    }
  }

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

  toggleCollapse(): void {
    const nextState = !this.isCollapsed();
    this.isCollapsed.set(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  }

  onResizeStart(event: MouseEvent): void {
    if (this.isCollapsed()) return;
    event.preventDefault();
    this.isResizing.set(true);
    this.startX = event.clientX;
    this.startWidth = this.sidebarWidth();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - this.startX;
      let newWidth = this.startWidth + deltaX;

      if (newWidth < 140) {
        this.isCollapsed.set(true);
        localStorage.setItem('sidebar_collapsed', 'true');
        return;
      }

      if (this.isCollapsed()) {
        this.isCollapsed.set(false);
        localStorage.setItem('sidebar_collapsed', 'false');
      }

      newWidth = Math.max(180, Math.min(newWidth, 420));
      this.sidebarWidth.set(newWidth);
    };

    const onMouseUp = () => {
      this.isResizing.set(false);
      localStorage.setItem('sidebar_width', String(this.sidebarWidth()));
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  resetWidth(event: MouseEvent): void {
    event.preventDefault();
    this.sidebarWidth.set(260);
    this.isCollapsed.set(false);
    localStorage.setItem('sidebar_width', '260');
    localStorage.setItem('sidebar_collapsed', 'false');
  }

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
