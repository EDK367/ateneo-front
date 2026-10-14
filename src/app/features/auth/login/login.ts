import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/config/notification';
import { TokenService } from '../../../core/services/config/token';
import { SessionService } from '../../../core/services/config/session';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  @ViewChild('container') container!: ElementRef;
  @ViewChild('registerButton') registerButton!: ElementRef;
  @ViewChild('loginButton') loginButton!: ElementRef;

  loginForm = {
    user: '',
    password: ''
  };

  registerForm = {
    username: '',
    email: '',
    password: ''
  };

  showPasswordLogin = false;
  showPasswordRegister = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private tokenService: TokenService,
    private sessionService: SessionService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.registerButton.nativeElement.addEventListener('click', () => {
      this.container.nativeElement.classList.add('active');
    });

    this.loginButton.nativeElement.addEventListener('click', () => {
      this.container.nativeElement.classList.remove('active');
    });
  }

  togglePasswordLogin() {
    this.showPasswordLogin = !this.showPasswordLogin;
  }

  togglePasswordRegister() {
    this.showPasswordRegister = !this.showPasswordRegister;
  }

  onLogin() {
    if (!this.loginForm.user || !this.loginForm.password) {
      this.notificationService.showError('Por favor ingresa usuario y contraseña', 'Campos requeridos');
      return;
    }

    this.authService.login(this.loginForm).subscribe({
      next: (resp) => {
        this.tokenService.saveTokens(resp.access_token);

        this.authService.profile().subscribe({
          next: (profile) => {
            this.sessionService.saveUser(profile);
            this.notificationService.showSuccess(`¡Bienvenido, ${profile.username}!`, 'Bienvenido');
          },
          error: () => {
            this.notificationService.showSuccess(`¡Bienvenido, ${this.loginForm.user}!`, 'Bienvenido');
          }
        });
      },
      error: (error) => {
        console.log("Login error", error);
      }
    });
  }

  onRegister() {
    if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
      this.notificationService.showError('Todos los campos son obligatorios', 'Campos requeridos');
      return;
    }

    this.authService.register(this.registerForm).subscribe({
      next: (resp) => {
        this.notificationService.showSuccess(`¡Usuario ${this.registerForm.username} registrado exitosamente!`, 'Registro');
        this.container.nativeElement.classList.remove('active');
        this.loginForm.user = this.registerForm.username;
        this.registerForm = {
          username: '',
          email: '',
          password: ''
        };
      },
      error: (error) => {
        console.log("Register error", error);
      }
    });
  }

}