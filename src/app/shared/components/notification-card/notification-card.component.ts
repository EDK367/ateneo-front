import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/config/notification';

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.css'
})
export class NotificationCardComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private sub: Subscription | null = null;
  private timeouts = new Map<string, any>();

  notifications = signal<NotificationItem[]>([]);

  ngOnInit(): void {
    this.sub = this.notificationService.toast$.subscribe(toast => {
      const item: NotificationItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: toast.type,
        title: toast.title,
        message: toast.message,
        timestamp: new Date()
      };

      this.notifications.update(current => [item, ...current.slice(0, 3)]);

      const timeoutId = setTimeout(() => {
        this.dismiss(item.id);
      }, 6000);

      this.timeouts.set(item.id, timeoutId);
    });
  }

  dismiss(id: string): void {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts.clear();
  }
}
