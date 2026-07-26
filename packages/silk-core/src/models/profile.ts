import type { ActionDescriptor } from './action.js';
import type { IdentityModel } from './identity.js';
import type { StatModel } from './stat.js';

export interface ProfileModel {
  readonly identity: IdentityModel;
  readonly bio?: string;
  readonly stats?: readonly StatModel[];
  readonly actions?: readonly ActionDescriptor[];
}
