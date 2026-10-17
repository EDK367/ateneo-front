import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import {
  AllSharesResponse,
  CreateShareRequest,
  SharedResourceResponse,
  ShareResponse,
  UpdateShareRequest
} from '../models/share';
import { MessageResponse } from '../models/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShareService extends ApiService {
  create(data: CreateShareRequest): Observable<ShareResponse> {
    return this.post<ShareResponse>('/shares', data);
  }

  findAll(): Observable<AllSharesResponse> {
    return this.get<AllSharesResponse>('/shares');
  }

  findSharedWithMe(): Observable<SharedResourceResponse[]> {
    return this.get<SharedResourceResponse[]>('/shares/shared-with-me');
  }

  findSharedByMe(): Observable<SharedResourceResponse[]> {
    return this.get<SharedResourceResponse[]>('/shares/shared-by-me');
  }

  findById(id: string): Observable<SharedResourceResponse> {
    return this.get<SharedResourceResponse>(`/shares/${id}`);
  }

  updateAuthorization(id: string, data: UpdateShareRequest): Observable<ShareResponse> {
    return this.patch<ShareResponse>(`/shares/${id}/authorization`, data);
  }

  deleteShare(id: string): Observable<MessageResponse> {
    return this.delete<MessageResponse>(`/shares/${id}`);
  }
}
