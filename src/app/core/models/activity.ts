export type ActivityAction =
  | 'upload'
  | 'download'
  | 'rename'
  | 'move'
  | 'delete'
  | 'restore'
  | 'purge'
  | 'share'
  | 'unshare';

export type ActivityResourceType = 'file' | 'folder' | 'share';

export interface ActivityResponse {
  _id: string;
  userId: string;
  action: ActivityAction;
  resourceType: ActivityResourceType;
  resourceId: string;
  resourceName?: string;
  details?: Record<string, any>;
  createdAt: string;
}
