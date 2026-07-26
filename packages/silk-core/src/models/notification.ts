import type { IdentityModel } from './identity.js';

export interface NotificationModel {
  readonly id: string;
  readonly kind: 'like' | 'reply' | 'mention' | 'follow' | 'system';
  readonly actor?: IdentityModel;
  readonly text: string;
  readonly createdAt: string;
  readonly read: boolean;
  readonly href?: string;
}
