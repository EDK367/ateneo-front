import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import {
  FileRawResponse,
  FileResponse,
  MoveFileRequest,
  RenameFileRequest
} from '../models/file';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService extends ApiService {
  upload(file: File, folderId?: string, tags?: string[]): Observable<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    return this.post<FileResponse>('/files/upload', formData);
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/files/${id}/download`, { responseType: 'blob' });
  }

  getRaw(id: string): Observable<FileRawResponse> {
    return this.get<FileRawResponse>(`/files/${id}/raw`);
  }

  rename(id: string, data: RenameFileRequest): Observable<FileResponse> {
    return this.patch<FileResponse>(`/files/${id}/rename`, data);
  }

  move(id: string, data: MoveFileRequest): Observable<FileResponse> {
    return this.patch<FileResponse>(`/files/${id}/move`, data);
  }

  deleteFile(id: string): Observable<FileResponse> {
    return this.delete<FileResponse>(`/files/${id}`);
  }
}
