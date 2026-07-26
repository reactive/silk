import { controlGeometryCss, controlSizePadding } from './controlGeometry';

export { controlSizePadding };

/**
 * Text-like form controls (Input, Textarea): shared geometry + full width +
 * placeholder. Built on `controlGeometryCss('input')`.
 */
export const controlBaseCss: string = `
  ${controlGeometryCss('input')}
  width: 100%;

  &::placeholder {
    color: var(--silk-color-text-secondary);
  }
`;
