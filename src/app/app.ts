import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
}
