import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

// servicio para la notificacion
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  // exitos
  showSuccess(message: string, title: string = 'Éxito'): void {
    this.toastSubject.next({ type: 'success', title, message });
  }

  // errores
  showError(message: string, title: string = 'Error'): void {
    this.toastSubject.next({ type: 'error', title, message });
  }

  // los popup de mensajes
  showToast(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string): void {
    this.toastSubject.next({ type, title, message });
  }
}
