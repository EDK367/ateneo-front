import { FileResponse } from './file';

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
}

export interface FolderContentResponse {
  currentFolder: FolderResponse | null;
  folders: FolderResponse[];
  files: FileResponse[];
}
