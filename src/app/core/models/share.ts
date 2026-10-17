import { FileResponse } from './file';
import { FolderResponse } from './folder';

export type ShareResourceType = 'file' | 'folder';

export type SharePermission = 'read' | 'comment' | 'edit';

export interface SharedUser {
  _id: string;
  username: string;
  email: string;
}

export interface ShareResponse {
  _id: string;
  resourceType: ShareResourceType;
  resourceId: string;
  ownerId: string;
  sharedWithId: string;
  permission: SharePermission;
  createdAt: string;
  updatedAt: string;
}

export interface SharedResourceResponse {
  _id: string;
  resourceType: ShareResourceType;
  resourceId: string;
  ownerId: SharedUser | string;
  sharedWithId: SharedUser | string;
  permission: SharePermission;
  resource: FileResponse | FolderResponse;
  createdAt: string;
  updatedAt: string;
}

export interface AllSharesResponse {
  sharedWithMe: SharedResourceResponse[];
  sharedByMe: SharedResourceResponse[];
}
