import type { ToneName } from '../tokens/types.js';

export interface ActionDescriptor {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly tone?: ToneName;
}
