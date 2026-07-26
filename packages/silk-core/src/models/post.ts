import type { ActionDescriptor } from './action.js';
import type { IdentityModel } from './identity.js';
import type { MediaModel } from './media.js';
import type { StatModel } from './stat.js';

export interface PostModel {
  readonly id: string;
  readonly author: IdentityModel;
  readonly body: string;
  readonly createdAt: string;
  readonly media?: readonly MediaModel[];
  readonly stats?: readonly StatModel[];
  readonly actions?: readonly ActionDescriptor[];
}
