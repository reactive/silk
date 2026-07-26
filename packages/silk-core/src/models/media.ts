export interface MediaModel {
  readonly id: string;
  readonly kind: 'image' | 'video';
  readonly src: string;
  readonly alt: string;
  readonly poster?: string;
}
