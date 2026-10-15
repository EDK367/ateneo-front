import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';
import { FooterComponent } from '../../shared/components/layout/footer/footer';
import { HeaderComponent } from '../../shared/components/layout/header/header';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, FooterComponent, HeaderComponent],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class UserComponent {}
