import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit {
  
  private router = inject(Router);

  isMenuOpen = false;
  isDarkMode = true;

  readonly isPanel = computed(() => {
    const url = this.router.url;
    return url.startsWith('/admin') || url.startsWith('/user');
  });

  ngOnInit() {
    this.isDarkMode = !document.body.classList.contains('light-theme');
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (!this.isDarkMode) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }
}
