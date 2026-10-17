import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { TrashListResponse, TrashRestoreResponse } from '../models/trash';
import { MessageResponse } from '../models/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrashService extends ApiService {
  findAll(): Observable<TrashListResponse> {
    return this.get<TrashListResponse>('/trash');
  }

  restore(id: string): Observable<TrashRestoreResponse> {
    return this.post<TrashRestoreResponse>(`/trash/restore/${id}`, {});
  }

  emptyTrash(): Observable<MessageResponse> {
    return this.delete<MessageResponse>('/trash/empty');
  }

  purge(id: string): Observable<MessageResponse> {
    return this.delete<MessageResponse>(`/trash/purge/${id}`);
  }
}
