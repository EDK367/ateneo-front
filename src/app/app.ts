import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NotificationCardComponent } from './shared/components/notification-card/notification-card.component';
import { FooterComponent } from './shared/components/layout/footer/footer';
import { HeaderComponent } from './shared/components/layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationCardComponent, FooterComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ateneo-front');
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects || e.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isAuthRoute = computed(() => {
    const url = this.currentUrl() || '';
    return !url.startsWith('/admin') && !url.startsWith('/user');
  });
}
