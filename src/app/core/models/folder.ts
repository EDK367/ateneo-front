import { FileResponse } from './file';

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface MoveFolderRequest {
  newParentId?: string | null;
}

export interface RenameFolderRequest {
  name: string;
}

export interface FolderResponse {
  _id: string;
  name: string;
  ownerId: string;
  parentId: string | null;
  ancestors: string[];
  deletedAt: string | null;
  trashRootId: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface FolderContentResponse {
  currentFolder: FolderResponse | null;
  folders: FolderResponse[];
  files: FileResponse[];
}
