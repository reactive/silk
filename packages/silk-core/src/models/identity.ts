export interface IdentityModel {
  readonly id: string;
  readonly name: string;
  readonly meta?: string;
  readonly avatar?: { readonly src: string; readonly alt: string };
  readonly fallback?: string;
}
