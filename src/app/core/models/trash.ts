import { FileResponse } from './file';
import { FolderResponse } from './folder';

export interface TrashListResponse {
  folders: FolderResponse[];
  files: FileResponse[];
}

export type TrashRestoreResponse = FolderResponse | FileResponse;
