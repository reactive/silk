/**
 * Shared shimmer motion (Skeleton indeterminate fill, Progress indeterminate).
 * Callers supply mid-stop color and a unique keyframes name.
 */
export function shimmerFillCss(
  animationName: string,
  midStop: string,
): string {
  return `
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    ${midStop} 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: ${animationName} var(--silk-motion-loop-duration-ms)
    var(--silk-motion-loop-easing) infinite;

  @keyframes ${animationName} {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: -100% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-image: none;
  }
`;
}
