import type { ActionDescriptor } from './action.js';
import type { IdentityModel } from './identity.js';

export interface CommentModel {
  readonly id: string;
  readonly author: IdentityModel;
  readonly body: string;
  readonly createdAt: string;
  readonly replies?: readonly CommentModel[];
  readonly replyCount: number;
  readonly hasMoreReplies: boolean;
  readonly actions?: readonly ActionDescriptor[];
}
