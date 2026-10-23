import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './config/api';
import {
  CreateFolderRequest,
  FolderContentResponse,
  FolderResponse,
  MoveFolderRequest,
  RenameFolderRequest
} from '../models/folder';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FolderService extends ApiService {
  create(folder: CreateFolderRequest): Observable<FolderResponse> {
    return this.post<FolderResponse>('/folders', folder);
  }

  getContent(folderId?: string | null): Observable<FolderContentResponse> {
    const cleanId = folderId && folderId !== 'null' && folderId !== 'undefined' && folderId.trim() !== '' ? folderId.trim() : null;
    const params = cleanId ? new HttpParams().set('folderId', cleanId) : undefined;
    return this.get<FolderContentResponse>('/folders/content', params);
  }

  move(id: string, data: MoveFolderRequest): Observable<FolderResponse> {
    return this.patch<FolderResponse>(`/folders/${id}/move`, data);
  }

  rename(id: string, data: RenameFolderRequest): Observable<FolderResponse> {
    return this.patch<FolderResponse>(`/folders/${id}/rename`, data);
  }

  deleteFolder(id: string): Observable<FolderResponse> {
    return this.delete<FolderResponse>(`/folders/${id}`);
  }
}
