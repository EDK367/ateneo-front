export type FileType = 'txt' | 'md';

export interface FileResponse {
  _id: string;
  name: string;
  type: FileType;
  size: number;
  gridFsId: string;
  ownerId: string;
  folderId: string | null;
  tags: string[];
  deletedAt: string | null;
  trashRootId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileRawResponse {
  file: FileResponse;
  content: string;
}
